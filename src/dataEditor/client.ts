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

import * as fs from 'fs'
import {
  createSimpleFileLogger,
  getClientVersion,
  getServerHeartbeat,
  getServerVersion,
  getSessionCount,
  IServerHeartbeat,
  setAutoFixViewportDataLength,
  setLogger,
  startServer,
  stopServerUsingPID,
} from '@omega-edit/client'
import path from 'path'
import * as vscode from 'vscode'
import XDGAppPaths from 'xdg-app-paths'
import { DataEditorWebView } from './dataEditorWebView'
import {
  checkServerListening,
  initOmegaEditClient,
  removeDirectory,
} from './utils'
import assert from 'assert'

export const dataEditorCommand: string = 'extension.data.edit'
export const omegaEditHost: string = '127.0.0.1'
export const serverStartTimeout: number = 15 // in seconds
export let omegaEditPort: number = 0
export const appDataPath: string = XDGAppPaths({ name: 'omega_edit' }).data()
export let checkpointPath: string = ''

let heartBeatIntervalId: NodeJS.Timer | undefined = undefined

const DEFAULT_OMEGA_EDIT_PORT: number = 9000
const OMEGA_EDIT_MIN_PORT: number = 1024
const OMEGA_EDIT_MAX_PORT: number = 65535
const MAX_LOG_FILES: number = 5 // Maximum number of log files to keep TODO: make this configurable
export const HEARTBEAT_INTERVAL_MS = 1000 // 1 second (1000 ms)

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
  return path.join(appDataPath, `serv-${serverPort}.pid`)
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
    checkpointPath = path.join(appDataPath, `.checkpoint-${omegaEditPort}`)
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
    ?.replace('${workspaceFolder}', appDataPath)
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
    appDataPath,
    `serv-${omegaEditPort}.logconf.xml`
  )
  rotateLogFiles(logFile)
  fs.writeFileSync(logbackConfigFile, logbackConfig)
  return logbackConfigFile // Return the path to the logback config file
}

interface IHeartbeatInfo extends IServerHeartbeat {
  omegaEditPort: number
}
export class HeartbeatInfo implements IHeartbeatInfo {
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

export let heartbeatInfo: IHeartbeatInfo = new HeartbeatInfo()
let activeSessions: string[] = []

export function addActiveSession(sessionId: string) {
  if (!activeSessions.includes(sessionId)) {
    activeSessions.push(sessionId)
    // scale the heartbeat interval based on the number of active sessions
    getHeartbeat().then(() => {
      if (heartBeatIntervalId) {
        clearInterval(heartBeatIntervalId)
      }
      heartBeatIntervalId = setInterval(async () => {
        await getHeartbeat()
      }, HEARTBEAT_INTERVAL_MS * activeSessions.length)
    })
  }
}

export function removeActiveSession(sessionId: string) {
  const index = activeSessions.indexOf(sessionId)
  if (index >= 0) {
    activeSessions.splice(index, 1)
    clearInterval(heartBeatIntervalId)
    heartBeatIntervalId = undefined
    if (activeSessions.length > 0) {
      // scale the heartbeat interval based on the number of active sessions
      getHeartbeat().then(() => {
        heartBeatIntervalId = setInterval(async () => {
          await getHeartbeat()
        }, HEARTBEAT_INTERVAL_MS * activeSessions.length)
      })
    }
  }
}

async function getHeartbeat() {
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
    path.join(appDataPath, `serv-${omegaEditPort}.log`),
    process.env.OMEGA_EDIT_SERVER_LOG_LEVEL ||
      config.get<string>('logLevel', 'info')
  )
  if (!fs.existsSync(logConfigFile)) {
    throw new Error(`Log config file '${logConfigFile}' not found`)
  }

  // Start the server and wait up to 10 seconds for it to start
  const serverPid = (await Promise.race([
    startServer(
      omegaEditPort,
      omegaEditHost,
      getPidFile(omegaEditPort),
      logConfigFile
    ),
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject((): Error => {
          return new Error(
            `Server startup timed out after ${serverStartTimeout} seconds`
          )
        })
      }, serverStartTimeout * 1000)
    }),
  ])) as number | undefined
  if (serverPid === undefined || serverPid <= 0) {
    throw new Error('Server failed to start or PID is invalid')
  }
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

async function isServerRunning(): Promise<boolean> {
  return await checkServerListening(omegaEditPort, omegaEditHost)
}

export function activate(ctx: vscode.ExtensionContext) {
  fs.mkdirSync(appDataPath, { recursive: true })

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      dataEditorCommand,
      async (fileToEdit: string = '') => {
        configureOmegaEditPort()
        // only start uo the server if one is not already running
        if (!(await isServerRunning())) {
          setupLogging()
          setAutoFixViewportDataLength(true)
          await serverStart()
          await initOmegaEditClient(omegaEditPort)
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
  const dataEditorView = new DataEditorWebView(
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

        // inform the UI that the server has been stopped
        const statusBarItem = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Left
        )
        statusBarItem.text = `Ωedit server on port ${omegaEditPort} has been stopped`
        statusBarItem.show()

        // dispose of the status bar message after 5 seconds
        setTimeout(() => {
          statusBarItem.dispose()
        }, 5000)
      }
    },
    undefined,
    ctx.subscriptions
  )

  dataEditorView.show()
  return dataEditorView
}
