/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  ALL_EVENTS,
  clear,
  CountKind,
  createSession,
  createSimpleFileLogger,
  createViewport,
  destroySession,
  edit,
  EditorClient,
  EventSubscriptionRequest,
  getClient,
  getClientVersion,
  getComputedFileSize,
  getCounts,
  getLogger,
  getServerHeartbeat,
  getServerVersion,
  getSessionCount,
  getViewportData,
  IOFlags,
  IServerHeartbeat,
  modifyViewport,
  notifyChangedViewports,
  pauseViewportEvents,
  redo,
  replaceSession,
  resumeViewportEvents,
  saveSession,
  SaveStatus,
  searchSession,
  setAutoFixViewportDataLength,
  setLogger,
  startServer,
  stopServerUsingPID,
  undo,
  ViewportDataResponse,
  ViewportEvent,
} from '@omega-edit/client'
import { EditorMessage, MessageCommand } from '../svelte/src/utilities/message'
import { SvelteWebviewInitializer } from './svelteWebviewInitializer'
import { EditByteModes } from '../svelte/src/stores/Configuration'
import { radixBytePad } from '../svelte/src/utilities/display'
import path from 'path'
import * as vscode from 'vscode'
import XDGAppPaths from 'xdg-app-paths'
import assert from 'assert'
import net from 'net'
import fs from 'fs'

// Interfaces
interface IHeartbeatInfo extends IServerHeartbeat {
  omegaEditPort: number
}

// Classes
class HeartbeatInfo implements IHeartbeatInfo {
  omegaEditPort: number = 0 // Ωedit server port
  latency: number = 0 // latency in ms
  serverCommittedMemory: number = 0 // committed memory in bytes
  serverCpuCount: number = 0 // cpu count
  serverCpuLoadAverage: number = 0 // cpu load average
  serverHostname: string = 'unknown' // hostname
  serverMaxMemory: number = 0 // max memory in bytes
  serverProcessId: number = 0 // process id
  serverTimestamp: number = 0 // timestamp in ms
  serverUptime: number = 0 // uptime in ms
  serverUsedMemory: number = 0 // used memory in bytes
  serverVersion: string = 'unknown' // server version
  sessionCount: number = 0 // session count
}

// Constants
export const DATA_EDITOR_COMMAND: string = 'extension.data.edit'
export const OMEGA_EDIT_HOST: string = '127.0.0.1'
export const SERVER_START_TIMEOUT: number = 15 // in seconds
export const APP_DATA_PATH: string = XDGAppPaths({ name: 'omega_edit' }).data()
const DEFAULT_OMEGA_EDIT_PORT: number = 9000
const OMEGA_EDIT_MIN_PORT: number = 1024
const OMEGA_EDIT_MAX_PORT: number = 65535
const MAX_LOG_FILES: number = 5 // Maximum number of log files to keep TODO: make this configurable
const HEARTBEAT_INTERVAL_MS = 1000 // 1 second (1000 ms)
const VIEWPORT_CAPACITY_MAX = 16 * 640 // 10240, Ωedit maximum viewport size is 1048576 (1024 * 1024)

// File-scoped variables
let checkpointPath: string = ''
let omegaEditPort: number = 0
let heartBeatIntervalId: NodeJS.Timer | undefined = undefined
let client: EditorClient
let heartbeatInfo: IHeartbeatInfo = new HeartbeatInfo()
let activeSessions: string[] = []

/**
 * Subscribe to all events for a given viewport so the editor gets refreshed when changes to the viewport occur
 * @param panel webview panel to send updates to
 * @param viewportId id of the viewport to subscribe to
 */
async function viewportSubscribe(
  panel: vscode.WebviewPanel,
  viewportId: string
) {
  // initial viewport population
  await sendViewportData(panel, viewportId)

  // subscribe to all viewport events
  client
    .subscribeToViewportEvents(
      new EventSubscriptionRequest().setId(viewportId).setInterest(ALL_EVENTS)
    )
    .on('data', async (event: ViewportEvent) => {
      getLogger().debug(
        `viewport '${event.getViewportId()}' received event: ${event.getViewportEventKind()}`
      )
      await sendViewportData(panel, viewportId)
    })
    .on('error', (err) => {
      // Call cancelled thrown sometimes when server is shutdown
      if (
        !err.message.includes('Call cancelled') &&
        !err.message.includes('UNAVAILABLE')
      )
        throw err
    })
}

/**
 * Get the viewport data for a given viewport and send it to the editor
 * @param panel webview panel to send updates to
 * @param viewportId id of the viewport to get data for
 */
async function sendViewportData(
  panel: vscode.WebviewPanel,
  viewportId: string
) {
  getViewportData(viewportId).then(
    async (viewportDataResponse: ViewportDataResponse) => {
      panel.webview.postMessage({
        command: MessageCommand.viewportRefresh,
        data: {
          viewportOffset: viewportDataResponse.getOffset(),
          viewportLength: viewportDataResponse.getLength(),
          viewportFollowingByteCount:
            viewportDataResponse.getFollowingByteCount(),
          viewportData: viewportDataResponse.getData_asU8(),
          viewportCapacity: VIEWPORT_CAPACITY_MAX,
        },
      })
    }
  )
}

/**
 * Removes a directory and all of its contents
 * @param dirPath path to directory to remove
 */
function removeDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = `${dirPath}/${file}`
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursively remove subdirectories
        removeDirectory(curPath)
      } else {
        // Delete file
        fs.unlinkSync(curPath)
      }
    })

    // Remove empty directory
    fs.rmdirSync(dirPath)
  }
}

function rotateLogFiles(logFile: string) {
  interface LogFile {
    path: string
    ctime: Date
  }

  if (MAX_LOG_FILES <= 0) {
    throw new Error('Maximum number of log files must be greater than 0')
  }
  if (fs.existsSync(logFile)) {
    const logDir = path.dirname(logFile)
    const logFileName = path.basename(logFile)

    // Get list of existing log files
    const logFiles: LogFile[] = fs
      .readdirSync(logDir)
      .filter((file) => file.startsWith(logFileName) && file !== logFileName)
      .map((file) => ({
        path: path.join(logDir, file),
        ctime: fs.statSync(path.join(logDir, file)).ctime,
      }))
      .sort((a, b) => b.ctime.getTime() - a.ctime.getTime())

    // Delete oldest log files if maximum number of log files is exceeded
    while (logFiles.length >= MAX_LOG_FILES) {
      const fileToDelete = logFiles.pop() as LogFile
      fs.unlinkSync(fileToDelete.path)
    }

    // Rename current log file with timestamp and create a new empty file
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    fs.renameSync(logFile, path.join(logDir, `${logFileName}.${timestamp}`))
  }
}

function getPidFile(serverPort: number) {
  return path.join(APP_DATA_PATH, `serv-${serverPort}.pid`)
}

/**
 * Checks if a server is listening on a given port and host
 * @param port port to check
 * @param host host to check
 * @returns true if a server is listening on the given port and host, false otherwise
 */
function checkServerListening(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket: net.Socket = new net.Socket()
    socket.setTimeout(2000) // set a 2-second timeout for the connection attempt
    socket.on('connect', () => {
      socket.destroy() // close the connection once connected
      resolve(true) // server is listening
    })
    socket.on('timeout', () => {
      socket.destroy() // close the connection on timeout
      resolve(false) // server is not listening
    })
    socket.on('error', () => {
      resolve(false) // server is not listening or an error occurred
    })
    socket.connect(port, host)
  })
}

function configureOmegaEditPort() {
  if (omegaEditPort === 0) {
    /**
     * Loop through all available configurations inside of launch.json
     * If dataEditor.omegaEditPort is set then we update the port
     *   NOTE: Whichever configuration sets the last will be the value used
     */
    vscode.workspace
      .getConfiguration(
        'launch',
        vscode.workspace.workspaceFolders
          ? vscode.workspace.workspaceFolders[0].uri
          : vscode.Uri.parse('')
      )
      .get<Array<Object>>('configurations')
      ?.forEach((config) => {
        omegaEditPort =
          'dataEditor' in config && 'port' in (config['dataEditor'] as object)
            ? ((config['dataEditor'] as object)['port'] as number)
            : omegaEditPort
      })

    omegaEditPort =
      omegaEditPort !== 0 ? omegaEditPort : DEFAULT_OMEGA_EDIT_PORT

    if (
      omegaEditPort <= OMEGA_EDIT_MIN_PORT ||
      omegaEditPort > OMEGA_EDIT_MAX_PORT
    ) {
      const message = `Invalid port ${omegaEditPort} for Ωedit. Use a port between ${OMEGA_EDIT_MIN_PORT} and ${OMEGA_EDIT_MAX_PORT}`
      omegaEditPort = 0
      throw new Error(message)
    }
    // Set the checkpoint path to be used by Ωedit sessions
    checkpointPath = path.join(APP_DATA_PATH, `.checkpoint-${omegaEditPort}`)
    if (!fs.existsSync(checkpointPath)) {
      fs.mkdirSync(checkpointPath, { recursive: true })
    }
  }
}

function setupLogging() {
  const config = vscode.workspace.getConfiguration('dataEditor')
  const logFile = config
    .get<string>(
      'logFile',
      '${workspaceFolder}/dataEditor-${omegaEditPort}.log'
    )
    ?.replace('${workspaceFolder}', APP_DATA_PATH)
    .replace('${omegaEditPort}', omegaEditPort.toString())
  const logLevel =
    process.env.OMEGA_EDIT_CLIENT_LOG_LEVEL ||
    config.get<string>('logLevel', 'info')
  rotateLogFiles(logFile)
  setLogger(createSimpleFileLogger(logFile, logLevel))
  vscode.window.showInformationMessage(
    `Logging to '${logFile}', at level '${logLevel}'`
  )
}

async function serverStop() {
  const serverPidFile = getPidFile(omegaEditPort)
  if (fs.existsSync(serverPidFile)) {
    const pid = parseInt(fs.readFileSync(serverPidFile).toString())
    if (await stopServerUsingPID(pid)) {
      vscode.window.setStatusBarMessage(
        `Ωedit server stopped on port ${omegaEditPort} with PID ${pid}`,
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(true)
          }, 2000)
        })
      )
      removeDirectory(checkpointPath)
    } else {
      vscode.window.showErrorMessage(
        `Ωedit server on port ${omegaEditPort} with PID ${pid} failed to stop`
      )
    }
  }
}

function generateLogbackConfigFile(
  logFile: string,
  logLevel: string = 'INFO'
): string {
  const dirname = path.dirname(logFile)
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true })
  }
  logLevel = logLevel.toUpperCase()
  const logbackConfig = `<?xml version="1.0" encoding="UTF-8"?>\n
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.FileAppender">
        <file>${logFile}</file>
        <encoder>
            <pattern>[%date{ISO8601}] [%level] [%logger] [%marker] [%thread] - %msg MDC: {%mdc}%n</pattern>
        </encoder>
    </appender>
    <root level="${logLevel}">
        <appender-ref ref="FILE" />
    </root>
</configuration>
`
  const logbackConfigFile = path.join(
    APP_DATA_PATH,
    `serv-${omegaEditPort}.logconf.xml`
  )
  rotateLogFiles(logFile)
  fs.writeFileSync(logbackConfigFile, logbackConfig)
  return logbackConfigFile // Return the path to the logback config file
}

function addActiveSession(sessionId: string) {
  if (!activeSessions.includes(sessionId)) {
    activeSessions.push(sessionId)
    // scale the heartbeat interval based on the number of active sessions
    getHeartbeat()
    if (heartBeatIntervalId) {
      clearInterval(heartBeatIntervalId)
    }
    heartBeatIntervalId = setInterval(async () => {
      await getHeartbeat()
    }, HEARTBEAT_INTERVAL_MS * activeSessions.length)
  }
}

function removeActiveSession(sessionId: string) {
  const index = activeSessions.indexOf(sessionId)
  if (index >= 0) {
    activeSessions.splice(index, 1)
    clearInterval(heartBeatIntervalId)
    heartBeatIntervalId = undefined
    if (activeSessions.length > 0) {
      // scale the heartbeat interval based on the number of active sessions
      getHeartbeat()
      heartBeatIntervalId = setInterval(async () => {
        await getHeartbeat()
      }, HEARTBEAT_INTERVAL_MS * activeSessions.length)
    }
  }
}

function getHeartbeat() {
  assert(omegaEditPort > 0, `illegal Ωedit port ${omegaEditPort}`)
  getServerHeartbeat(activeSessions, HEARTBEAT_INTERVAL_MS)
    .then((heartbeat: IServerHeartbeat) => {
      heartbeatInfo.omegaEditPort = omegaEditPort
      heartbeatInfo.latency = heartbeat.latency
      heartbeatInfo.serverCommittedMemory = heartbeat.serverCommittedMemory
      heartbeatInfo.serverCpuCount = heartbeat.serverCpuCount
      heartbeatInfo.serverCpuLoadAverage = heartbeat.serverCpuLoadAverage
      heartbeatInfo.serverHostname = heartbeat.serverHostname
      heartbeatInfo.serverMaxMemory = heartbeat.serverMaxMemory
      heartbeatInfo.serverProcessId = heartbeat.serverProcessId
      heartbeatInfo.serverTimestamp = heartbeat.serverTimestamp
      heartbeatInfo.serverUptime = heartbeat.serverUptime
      heartbeatInfo.serverUsedMemory = heartbeat.serverUsedMemory
      heartbeatInfo.serverVersion = heartbeat.serverVersion
      heartbeatInfo.sessionCount = heartbeat.sessionCount
    })
    .catch((error) => {
      vscode.window.showErrorMessage(`Heartbeat error: ${error}`)
      // stop the heartbeat since the server is not responding
      if (heartBeatIntervalId) {
        clearInterval(heartBeatIntervalId)
        heartBeatIntervalId = undefined
      }
    })
}

async function serverStart() {
  await serverStop()
  const serverStartingText = `Ωedit server starting on port ${omegaEditPort}`
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  )
  statusBarItem.text = serverStartingText
  statusBarItem.show()

  let animationFrame = 0
  const animationInterval = 400 // ms per frame
  const animationFrames = ['', '.', '..', '...']
  const animationIntervalId = setInterval(() => {
    const frame = animationFrames[animationFrame % animationFrames.length]
    statusBarItem.text = `${serverStartingText} ${frame}`
    ++animationFrame
  }, animationInterval)
  const config = vscode.workspace.getConfiguration('dataEditor')
  const logConfigFile = generateLogbackConfigFile(
    path.join(APP_DATA_PATH, `serv-${omegaEditPort}.log`),
    process.env.OMEGA_EDIT_SERVER_LOG_LEVEL ||
      config.get<string>('logLevel', 'info')
  )
  if (!fs.existsSync(logConfigFile)) {
    throw new Error(`Log config file '${logConfigFile}' not found`)
  }

  // Start the server and wait for it to start
  const serverPid = (await Promise.race([
    startServer(
      omegaEditPort,
      OMEGA_EDIT_HOST,
      getPidFile(omegaEditPort),
      logConfigFile
    ),
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject((): Error => {
          return new Error(
            `Server startup timed out after ${SERVER_START_TIMEOUT} seconds`
          )
        })
      }, SERVER_START_TIMEOUT * 1000)
    }),
  ])) as number | undefined
  if (serverPid === undefined || serverPid <= 0) {
    throw new Error('Server failed to start or PID is invalid')
  }
  // verify that the client and server versions match
  const clientVersion = getClientVersion()
  const serverVersion = await getServerVersion()
  if (serverVersion !== clientVersion) {
    throw new Error(
      `Server version ${serverVersion} and client version ${clientVersion} must match`
    )
  }
  clearInterval(animationIntervalId)
  statusBarItem.text = `Ωedit server v${serverVersion} started on port ${omegaEditPort} with PID ${serverPid}`
  setTimeout(() => {
    statusBarItem.dispose()
  }, 5000)
}

export function activate(ctx: vscode.ExtensionContext) {
  fs.mkdirSync(APP_DATA_PATH, { recursive: true })

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      DATA_EDITOR_COMMAND,
      async (fileToEdit: string = '') => {
        configureOmegaEditPort()
        // only start uo the server if one is not already running
        if (!(await checkServerListening(omegaEditPort, OMEGA_EDIT_HOST))) {
          setupLogging()
          setAutoFixViewportDataLength(true)
          await serverStart()
          client = await getClient(omegaEditPort, OMEGA_EDIT_HOST)
        }
        // initialize the first server heartbeat
        await getHeartbeat()
        return await createOmegaEditWebviewPanel(ctx, fileToEdit)
      }
    )
  )
}

async function createOmegaEditWebviewPanel(
  ctx: vscode.ExtensionContext,
  fileToEdit: string
) {
  const dataEditorView = new DataEditor(
    ctx,
    'dataEditor',
    'Data Editor',
    fileToEdit
  )

  await dataEditorView.initialize()

  dataEditorView.panel.onDidDispose(
    async () => {
      await dataEditorView.dispose()
      // stop the server if the session count is zero
      const sessionCount = await getSessionCount()
      if (sessionCount === 0) {
        assert(activeSessions.length === 0)
        // stop the server
        await serverStop()
      }
    },
    undefined,
    ctx.subscriptions
  )

  dataEditorView.show()
  return dataEditorView
}

function fillRequestData(message: EditorMessage): [Buffer, string] {
  let selectionByteData: Buffer
  let selectionByteDisplay: string
  if (message.data.editMode === EditByteModes.Multiple) {
    selectionByteData = encodedStrToData(
      message.data.editedContent,
      message.data.encoding
    )
    selectionByteDisplay = dataToEncodedStr(
      selectionByteData,
      message.data.encoding
    )
  } else {
    selectionByteData =
      message.data.viewport === 'logical'
        ? encodedStrToData(message.data.editedContent, 'latin1')
        : Buffer.from([
            parseInt(message.data.editedContent, message.data.radix),
          ])

    selectionByteDisplay =
      message.data.viewport === 'logical'
        ? message.data.editedContent
        : dataToRadixStr(selectionByteData, message.data.radix)
  }

  return [selectionByteData, selectionByteDisplay]
}

function dataToRadixStr(buffer: Buffer, radix: number): string {
  const padLen = radixBytePad(radix)
  let ret = ''
  for (let i = 0; i < buffer.byteLength; i++) {
    ret += buffer[i].toString(radix).padStart(padLen, '0')
  }
  return ret
}

export function dataToEncodedStr(
  buffer: Buffer,
  encoding: BufferEncoding
): string {
  return encoding === 'binary'
    ? dataToRadixStr(buffer, 2)
    : buffer.toString(encoding)
}

function encodedStrToData(
  selectionEdits: string,
  selectionEncoding?: BufferEncoding
): Buffer {
  let selectionByteData: Buffer
  switch (selectionEncoding) {
    case 'hex':
      selectionByteData = Buffer.alloc(selectionEdits.length / 2)
      for (let i = 0; i < selectionEdits.length; i += 2) {
        selectionByteData[i / 2] = parseInt(selectionEdits.slice(i, i + 2), 16)
      }
      return selectionByteData
    case 'binary':
      selectionByteData = Buffer.alloc(selectionEdits.length / 8)
      for (let i = 0; i < selectionEdits.length; i += 8) {
        selectionByteData[i / 8] = parseInt(selectionEdits.slice(i, i + 8), 2)
      }
      return selectionByteData
    default:
      return Buffer.from(selectionEdits, selectionEncoding)
  }
}

function latin1Undefined(c: string): boolean {
  const charCode = c.charCodeAt(0)
  return charCode < 32 || (charCode > 126 && charCode < 160)
}

function logicalDisplay(bytes: ArrayBuffer, bytesPerRow: number): string {
  const undefinedCharStandIn = 9617
  let result = ''
  if (bytes.byteLength > 0) {
    // TODO: How does this affect the simple editor?
    // replace newlines with spaces for the logical display
    const data = Buffer.from(bytes).toString('latin1').replace('\n', ' ')
    let i = 0
    while (true) {
      for (let col = 0; i < data.length && col < bytesPerRow; ++col) {
        const c = data.charAt(i++)
        result +=
          (latin1Undefined(c) ? String.fromCharCode(undefinedCharStandIn) : c) +
          ' '
      }
      result = result.slice(0, result.length - 1)
      if (i === data.length) {
        break
      }
      result += '\n'
    }
  }
  return result
}

class DisplayState {
  public bytesPerRow: number
  public editorEncoding: BufferEncoding
  public colorThemeKind: vscode.ColorThemeKind
  private panel: vscode.WebviewPanel

  constructor(editorPanel: vscode.WebviewPanel) {
    this.bytesPerRow = 16
    this.editorEncoding = 'hex'
    this.colorThemeKind = vscode.window.activeColorTheme.kind
    this.panel = editorPanel

    vscode.window.onDidChangeActiveColorTheme((event) => {
      this.colorThemeKind = event.kind
      this.sendUIThemeUpdate()
    })
    this.sendUIThemeUpdate()
  }
  private sendUIThemeUpdate() {
    this.panel.webview.postMessage({
      command: MessageCommand.setUITheme,
      theme: this.colorThemeKind,
    })
  }
}

export class DataEditor implements vscode.Disposable {
  private contentType = ''
  private currentViewportId: string
  private displayState: DisplayState
  private fileSize = 0
  private fileToEdit: string = ''
  private heartBeatIntervalId: NodeJS.Timer | undefined = undefined
  private omegaSessionId = ''
  private svelteWebviewInitializer: SvelteWebviewInitializer
  public panel: vscode.WebviewPanel

  constructor(
    protected context: vscode.ExtensionContext,
    private view: string,
    title: string,
    fileToEdit: string = ''
  ) {
    this.panel = this.createPanel(title)
    this.panel.webview.onDidReceiveMessage(this.messageReceiver, this)
    this.svelteWebviewInitializer = new SvelteWebviewInitializer(context)
    this.svelteWebviewInitializer.initialize(this.view, this.panel.webview)
    this.currentViewportId = ''
    this.contentType = ''
    this.fileSize = 0
    this.fileToEdit = fileToEdit
    this.displayState = new DisplayState(this.panel)
  }

  async dispose(): Promise<void> {
    if (this.heartBeatIntervalId) {
      clearInterval(this.heartBeatIntervalId)
      this.heartBeatIntervalId = undefined
    }

    // destroy the session and remove it from the list of active sessions
    removeActiveSession(await destroySession(this.omegaSessionId))
    this.panel.dispose()
  }

  show(): void {
    this.panel.reveal()
  }

  public async initialize() {
    // start the server heartbeat
    await this.sendHeartbeat()
    this.heartBeatIntervalId = setInterval(async () => {
      await this.sendHeartbeat()
    }, HEARTBEAT_INTERVAL_MS)

    if (this.fileToEdit !== '') {
      await this.setupDataEditor()
    } else {
      vscode.window
        .showOpenDialog({
          canSelectMany: false,
          openLabel: 'Select',
          canSelectFiles: true,
          canSelectFolders: false,
        })
        .then(async (fileUri) => {
          if (fileUri && fileUri[0]) {
            this.fileToEdit = fileUri[0].fsPath
            this.panel.title = path.basename(this.fileToEdit)
            await this.setupDataEditor()
          }
        })
    }
  }

  private async setupDataEditor() {
    assert(
      checkpointPath && checkpointPath.length > 0,
      'checkpointPath is not set'
    )
    await createSession(this.fileToEdit, undefined, checkpointPath)
      .then(async (resp) => {
        this.omegaSessionId = resp.getSessionId()
        this.contentType = resp.hasContentType()
          ? (resp.getContentType() as string)
          : 'unknown'
        this.fileSize = resp.hasFileSize() ? (resp.getFileSize() as number) : 0
        addActiveSession(this.omegaSessionId)
        await this.sendDiskFileSize()
        await this.sendChangesInfo()
      })
      .catch(() => {
        vscode.window.showErrorMessage(
          `Failed to create session for ${this.fileToEdit}`
        )
      })
    await createViewport(
      undefined,
      this.omegaSessionId,
      0,
      VIEWPORT_CAPACITY_MAX,
      false
    )
      .then(async (resp) => {
        this.currentViewportId = resp.getViewportId()
        viewportSubscribe(this.panel, this.currentViewportId).then(async () => {
          this.panel.webview.postMessage({
            command: MessageCommand.fileInfo,
            data: {
              fileName: this.fileToEdit,
              computedFileSize: await getComputedFileSize(this.omegaSessionId),
            },
          })
        })
      })
      .catch(() => {
        vscode.window.showErrorMessage(
          `Failed to create viewport for ${this.fileToEdit}`
        )
      })
  }

  private async sendDiskFileSize() {
    await this.panel.webview.postMessage({
      command: MessageCommand.fileInfo,
      data: {
        fileName: this.fileToEdit,
        diskFileSize: this.fileSize,
        type: this.contentType,
      },
    })
  }

  private async sendHeartbeat() {
    await this.panel.webview.postMessage({
      command: MessageCommand.heartbeat,
      data: {
        omegaEditPort: heartbeatInfo.omegaEditPort,
        serverVersion: heartbeatInfo.serverVersion,
        serverLatency: heartbeatInfo.latency,
        serverCpuLoadAvg: heartbeatInfo.serverCpuLoadAverage,
        serverUsedMemory: heartbeatInfo.serverUsedMemory,
        serverUptime: heartbeatInfo.serverUptime,
        sessionCount: heartbeatInfo.sessionCount,
      },
    })
  }

  private createPanel(title: string): vscode.WebviewPanel {
    const column =
      vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn
        ? vscode.window.activeTextEditor?.viewColumn
        : vscode.ViewColumn.Active
    return vscode.window.createWebviewPanel(this.view, title, column, {
      enableScripts: true,
      retainContextWhenHidden: true,
    })
  }

  private async sendChangesInfo() {
    getCounts(this.omegaSessionId, [
      CountKind.COUNT_COMPUTED_FILE_SIZE,
      CountKind.COUNT_CHANGE_TRANSACTIONS,
      CountKind.COUNT_UNDO_TRANSACTIONS,
    ]).then((counts) => {
      let data = {
        fileName: this.fileToEdit,
        computedFileSize: 0,
        changeCount: 0,
        undoCount: 0,
      }
      counts.forEach((count) => {
        switch (count.getKind()) {
          case CountKind.COUNT_COMPUTED_FILE_SIZE:
            data.computedFileSize = count.getCount()
            break
          case CountKind.COUNT_CHANGE_TRANSACTIONS:
            data.changeCount = count.getCount()
            break
          case CountKind.COUNT_UNDO_TRANSACTIONS:
            data.undoCount = count.getCount()
            break
        }
      })
      this.panel.webview.postMessage({
        command: MessageCommand.fileInfo,
        data: data,
      })
    })
  }

  // handle messages from the webview
  private async messageReceiver(message: EditorMessage) {
    switch (message.command) {
      case MessageCommand.updateLogicalDisplay:
        this.displayState.bytesPerRow = message.data.bytesPerRow
        const logicalDisplayText = logicalDisplay(
          message.data.viewportData,
          this.displayState.bytesPerRow
        )
        await this.panel.webview.postMessage({
          command: MessageCommand.updateLogicalDisplay,
          data: {
            logicalDisplay: logicalDisplayText,
          },
        })
        break

      case MessageCommand.scrollViewport:
        await this.scrollViewport(
          this.currentViewportId,
          message.data.scrollOffset
        )
        break

      case MessageCommand.editorOnChange:
        if (message.data.saveEncoding)
          this.displayState.editorEncoding = message.data.encoding

        if (
          message.data.selectionData &&
          message.data.selectionData.length > 0
        ) {
          const bufSlice = Buffer.from(message.data.selectionData)
          await this.panel.webview.postMessage({
            command: MessageCommand.editorOnChange,
            display: dataToEncodedStr(
              bufSlice,
              this.displayState.editorEncoding
            ),
          })
        }
        break

      case MessageCommand.commit:
        await edit(
          this.omegaSessionId,
          message.data.offset,
          message.data.originalSegment,
          message.data.editedSegment
        )
          .then(async () => {
            await this.sendChangesInfo()
          })
          .catch(() => {
            vscode.window.showErrorMessage('Failed to commit changes')
          })
        break

      case MessageCommand.undo:
        await undo(this.omegaSessionId)
          .then(async () => {
            await this.sendChangesInfo()
          })
          .catch(() => {
            vscode.window.showErrorMessage('Failed to undo changes')
          })
        break

      case MessageCommand.redo:
        await redo(this.omegaSessionId)
          .then(async () => {
            await this.sendChangesInfo()
          })
          .catch(() => {
            vscode.window.showErrorMessage('Failed to redo changes')
          })
        break

      case MessageCommand.clear:
        const confirmation = await vscode.window.showInformationMessage(
          'Are you sure you want to revert all changes?',
          { modal: true },
          'Yes',
          'No'
        )
        if (confirmation === 'Yes') {
          await clear(this.omegaSessionId)
            .then(async () => {
              await this.sendChangesInfo()
            })
            .catch(() => {
              vscode.window.showErrorMessage('Failed to revert all changes')
            })
        }
        break

      case MessageCommand.save:
        let saved = false
        saveSession(
          this.omegaSessionId,
          this.fileToEdit,
          IOFlags.IO_FLG_OVERWRITE
        )
          .then(async (saveResponse) => {
            if (saveResponse.getSaveStatus() === SaveStatus.MODIFIED) {
              // Query user to overwrite the modified file
              const confirmation = await vscode.window.showInformationMessage(
                'File has been modified since being opened overwrite the file anyway?',
                { modal: true },
                'Yes',
                'No'
              )
              if (confirmation === 'Yes') {
                saveSession(
                  this.omegaSessionId,
                  this.fileToEdit,
                  IOFlags.IO_FLG_FORCE_OVERWRITE
                )
                  .then(async (saveResponse2) => {
                    saved = saveResponse2.getSaveStatus() === SaveStatus.SUCCESS
                  })
                  .catch(() => {
                    vscode.window.showErrorMessage(
                      `Failed to save over: ${this.fileToEdit}`
                    )
                  })
              }
            } else {
              saved = saveResponse.getSaveStatus() === SaveStatus.SUCCESS
            }
          })
          .catch(() => {
            vscode.window.showErrorMessage(
              `Failed to save over: ${this.fileToEdit}`
            )
          })
        if (saved) {
          vscode.window.showInformationMessage(`Saved: ${this.fileToEdit}`)
          await this.sendChangesInfo()
          await this.sendDiskFileSize()
        }
        break

      case MessageCommand.saveAs:
        vscode.window
          .showSaveDialog({
            title: 'Save Session',
            saveLabel: 'Save',
          })
          .then(async (uri) => {
            if (uri && uri.fsPath) {
              saveSession(
                this.omegaSessionId,
                uri.path,
                IOFlags.IO_FLG_OVERWRITE
              )
                .then(async (saveResponse) => {
                  if (saveResponse.getSaveStatus() === SaveStatus.MODIFIED) {
                    // Query user to overwrite the modified file
                    const confirmation =
                      await vscode.window.showInformationMessage(
                        'File has been modified since being opened overwrite the file anyway?',
                        { modal: true },
                        'Yes',
                        'No'
                      )
                    if (confirmation === 'Yes') {
                      saveSession(
                        this.omegaSessionId,
                        uri.path,
                        IOFlags.IO_FLG_FORCE_OVERWRITE
                      )
                        .then(async () => {
                          vscode.window.showInformationMessage(
                            `Saved: ${uri.path}`
                          )
                          if (uri.path === this.fileToEdit) {
                            await this.sendChangesInfo()
                            await this.sendDiskFileSize()
                          }
                        })
                        .catch(() => {
                          vscode.window.showErrorMessage(
                            `Failed to save over: ${uri.path}`
                          )
                        })
                    } else {
                      vscode.window.showInformationMessage(
                        `Save cancelled: ${uri.path}`
                      )
                    }
                  } else {
                    const fp = saveResponse.getFilePath()
                    vscode.window.showInformationMessage(`Saved: ${fp}`)
                    if (fp === this.fileToEdit) {
                      await this.sendChangesInfo()
                      await this.sendDiskFileSize()
                    }
                  }
                })
                .catch(() => {
                  vscode.window.showErrorMessage(`Failed to save: ${uri.path}`)
                })
            }
          })
        break

      case MessageCommand.requestEditedData:
        {
          const [selectionData, selectionDisplay] = fillRequestData(message)

          await this.panel.webview.postMessage({
            command: MessageCommand.requestEditedData,
            data: {
              data: Uint8Array.from(selectionData),
              dataDisplay: selectionDisplay,
            },
          })
        }
        break

      case MessageCommand.searchAndReplace:
        {
          const searchDataBytes = encodedStrToData(
            message.data.searchData,
            message.data.encoding
          )
          const replaceDataBytes = encodedStrToData(
            message.data.replaceData,
            message.data.encoding
          )
          getLogger().debug(
            `replacing '${message.data.searchData}' with '${message.data.replaceData}' using encoding ${message.data.encoding}`
          )
          // pause viewport events before search, then resume after search
          await pauseViewportEvents(this.omegaSessionId)
          replaceSession(
            this.omegaSessionId,
            searchDataBytes,
            replaceDataBytes,
            message.data.caseInsensitive,
            0,
            0,
            0
          )
            .catch((err) => {
              vscode.window.showErrorMessage(err)
            })
            .then(async (replacementsCount) => {
              await resumeViewportEvents(this.omegaSessionId)
              try {
                await notifyChangedViewports(this.omegaSessionId)
              } catch (err) {
                // notifyChangedViewports failed, so manually update the viewport
                await sendViewportData(this.panel, this.currentViewportId)
              }
              this.panel.webview.postMessage({
                command: MessageCommand.replaceResults,
                data: {
                  replacementsCount: replacementsCount,
                },
              })
              await this.sendChangesInfo()
            })
        }
        break

      case MessageCommand.search:
        {
          const searchDataBytes = encodedStrToData(
            message.data.searchData,
            message.data.encoding
          )
          getLogger().debug(
            `searching for '${message.data.searchData}' using encoding ${message.data.encoding}`
          )
          const searchResults = await searchSession(
            this.omegaSessionId,
            searchDataBytes,
            message.data.caseInsensitive,
            0,
            0,
            0
          )
          await this.panel.webview.postMessage({
            command: MessageCommand.searchResults,
            data: {
              results: searchResults,
            },
          })
        }
        break
    }
  }

  private async scrollViewport(viewportId: string, startOffset: number) {
    modifyViewport(viewportId, startOffset, VIEWPORT_CAPACITY_MAX).catch(() => {
      vscode.window.showErrorMessage(
        `Failed to scroll viewport ${viewportId} to offset ${startOffset}`
      )
    })
  }
}
