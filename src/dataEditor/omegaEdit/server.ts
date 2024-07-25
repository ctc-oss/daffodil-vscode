import { FilePath } from '.'
import { OmegaEditService } from './editService'
import path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import XDGAppPaths from 'xdg-app-paths'
import {
  createSimpleFileLogger,
  getClientVersion,
  getServerHeartbeat,
  getServerInfo,
  IServerHeartbeat,
  IServerInfo,
  setLogger,
  startServer,
  stopProcessUsingPID,
  stopServerGraceful,
} from '@omega-edit/client'
import { IConfig } from '../config'
import { IHeartbeatInfo } from '../include/server/heartbeat/HeartBeatInfo'
export const APP_DATA_PATH: string = XDGAppPaths({ name: 'omega_edit' }).data()

export class Connection {
  constructor(
    readonly host: string,
    readonly port: number
  ) {}
}

export class OmegaEditServer {
  private service: OmegaEditService
  constructor(readonly config: ServerConfig) {
    this.service = new OmegaEditService()
    this.service.onAllSessionsClosed(() => {
      serverStop(this.config)
    })
  }
  getService(): Promise<OmegaEditService> {
    return new Promise((res, rej) => {
      this.service ? res(this.service) : rej('No service was initialzied!')
    })
  }
  readonly dispose = () => {
    serverStop(this.config)
  }
}

function setupLogging(config: ServerConfig): Promise<void> {
  return new Promise((res, rej) => {
    const filePath = config.logFile.fullPath()
    const level = config.logLevel
    rotateLogFiles(filePath)
    setLogger(createSimpleFileLogger(filePath, level))
    res()
  })
}
export class ServerConfig {
  readonly conn: Connection
  readonly logFile: FilePath
  readonly logLevel: string
  readonly checkpointPath: string

  constructor(config: () => IConfig) {
    const { checkpointPath, logFile, logLevel, port } = config()
    this.conn = new Connection('127.0.0.1', port)
    this.logFile = new FilePath(logFile)
    this.logLevel = logLevel
    this.checkpointPath = checkpointPath
  }
}

export type GetServerConfigStrategy = () => Promise<ServerConfig>

const activeServers: Map<ServerConfig, OmegaEditServer> = new Map()
const ServerDisposeAll = {
  dispose: () => {
    activeServers.forEach((server) => {
      server.dispose()
    })
  },
}
export class OmegaEditServerManager {
  static Connect(config: () => IConfig): Promise<OmegaEditServer> {
    return new Promise(async (res, rej) => {
      const serverConfig = new ServerConfig(config)
      const loggerSetupComplete = setupLogging(serverConfig)
      const query = activeServers.get(serverConfig)
      if (query) res(query)

      const ret = new OmegaEditServer(serverConfig)
      await loggerSetupComplete
      await serverStart(ret.config)
      res(ret)
    })
  }
  static disposeAllServers() {
    return ServerDisposeAll
  }
}

function getPidFile(serverPort: number): string {
  return path.join(APP_DATA_PATH, `serv-${serverPort}.pid`)
}

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
const MAX_LOG_FILES = 5
function rotateLogFiles(logFile: string): void {
  interface LogFile {
    path: string
    ctime: Date
  }

  // assert(
  //   MAX_LOG_FILES > 0,
  //   'Maximum number of log files must be greater than 0'
  // )

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

function generateLogbackConfigFile(server: ServerConfig): string {
  const serverLogFile = path.join(APP_DATA_PATH, `serv-${server.conn.port}.log`)
  const dirname = path.dirname(server.logFile.fullPath())
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true })
  }
  const logbackConfig = `<?xml version="1.0" encoding="UTF-8"?>\n
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.FileAppender">
        <file>${serverLogFile}</file>
        <encoder>
            <pattern>[%date{ISO8601}] [%level] [%logger] [%marker] [%thread] - %msg MDC: {%mdc}%n</pattern>
        </encoder>
    </appender>
    <root level="${server.logLevel.toUpperCase()}">
        <appender-ref ref="FILE" />
    </root>
</configuration>
`
  const logbackConfigFile = path.join(
    APP_DATA_PATH,
    `serv-${server.conn.port}.logconf.xml`
  )
  rotateLogFiles(server.logFile.fullPath())
  fs.writeFileSync(logbackConfigFile, logbackConfig)
  return logbackConfigFile // Return the path to the logback config file
}

async function serverStop(server: ServerConfig) {
  const serverPidFile = getPidFile(server.conn.port)
  if (fs.existsSync(serverPidFile)) {
    const pid = parseInt(fs.readFileSync(serverPidFile).toString())
    if (await stopProcessUsingPID(pid)) {
      // vscode.window.setStatusBarMessage(
      //   `Ωedit server stopped on port ${omegaEditPort} with PID ${pid}`,
      //   new Promise((resolve) => {
      //     setTimeout(() => {
      //       resolve(true)
      //     }, 2000)
      //   })
      // )
      removeDirectory(server.checkpointPath)
    } else {
      // vscode.window.showErrorMessage(
      //   `Ωedit server on port ${omegaEditPort} with PID ${pid} failed to stop`
      // )
    }
  }
}
const SERVER_START_TIMEOUT = 15
async function serverStart(server: ServerConfig) {
  // await serverStop()
  // const serverStartingText = `Ωedit server starting on port ${server.conn.port}`
  // const statusBarItem = vscode.window.createStatusBarItem(
  //   vscode.StatusBarAlignment.Left
  // )
  // statusBarItem.text = serverStartingText
  // statusBarItem.show()

  // let animationFrame = 0
  // const animationInterval = 400 // ms per frame
  // const animationFrames = ['', '.', '..', '...']
  // const animationIntervalId = setInterval(() => {
  //   statusBarItem.text = `${serverStartingText} ${
  //     animationFrames[++animationFrame % animationFrames.length]
  //   }`
  // }, animationInterval)
  // const config = vscode.workspace.getConfiguration('dataEditor')
  // const logLevel =
  //   process.env.OMEGA_EDIT_SERVER_LOG_LEVEL ||
  //   process.env.OMEGA_EDIT_LOG_LEVEL ||
  //   config.get<string>('logLevel', 'info')
  // const logConfigFile =
  // if (!fs.existsSync(logConfigFile)) {
  // clearInterval(animationIntervalId)
  // statusBarItem.dispose()
  //   throw new Error(`Log config file '${logConfigFile}' not found`)
  // }

  // Start the server and wait up to 10 seconds for it to start
  const serverPid = (await Promise.race([
    startServer(
      server.conn.port,
      server.conn.host,
      getPidFile(server.conn.port),
      generateLogbackConfigFile(server)
    ),
    new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject((): Error => {
          return new Error(
            `Server startup timed out after ${SERVER_START_TIMEOUT} seconds`
          )
        })
      }, SERVER_START_TIMEOUT * 1000)
    }),
  ])) as number | undefined
  // clearInterval(animationIntervalId)
  if (serverPid === undefined || serverPid <= 0) {
    // statusBarItem.dispose()
    throw new Error('Server failed to start or PID is invalid')
  }
  // this makes sure the server if fully online and ready to take requests
  // statusBarItem.text = `Initializing Ωedit server on port ${omegaEditPort}`
  for (let i = 1; i <= 60; ++i) {
    try {
      await getServerInfo()
      break
    } catch (err) {
      // statusBarItem.text = `Initializing Ωedit server on port ${omegaEditPort} (${i}/60)`
    }
    // wait 1 second before trying again
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, 1000)
    })
  }
  let serverInfo: IServerInfo
  try {
    serverInfo = await getServerInfo()
  } catch (err) {
    // statusBarItem.dispose()
    await serverStop(server)
    throw new Error('Server failed to initialize')
  }
  // statusBarItem.text = `Ωedit server on port ${omegaEditPort} initialized`
  const serverVersion = serverInfo.serverVersion
  // if the OS is not Windows, check that the server PID matches the one started
  // NOTE: serverPid is the PID of the server wrapper script on Windows
  if (
    !os.platform().toLowerCase().startsWith('win') &&
    serverInfo.serverProcessId !== serverPid
  ) {
    // statusBarItem.dispose()
    throw new Error(
      `server PID mismatch ${serverInfo.serverProcessId} != ${serverPid}`
    )
  }
  const clientVersion = getClientVersion()
  if (serverVersion !== clientVersion) {
    // statusBarItem.dispose()
    throw new Error(
      `Server version ${serverVersion} and client version ${clientVersion} must match`
    )
  }
  // get an initial heartbeat
  await getHeartbeat((hb) => {
    console.log(hb)
  })
  // statusBarItem.text = `Ωedit server v${serverVersion} ready on port ${omegaEditPort} with PID ${serverInfo.serverProcessId}`
  // setTimeout(() => {
  // statusBarItem.dispose()
  // }, 5000)
}

const HEARTBEAT_INTERVAL_MS = 1000
async function getHeartbeat(callback: (heartbeat: IServerHeartbeat) => any) {
  // assert(omegaEditPort > 0, `illegal Ωedit port ${omegaEditPort}`)
  const heartbeat = await getServerHeartbeat([], HEARTBEAT_INTERVAL_MS)
  callback(heartbeat)
  // heartbeatInfo.omegaEditPort = omegaEditPort
  // heartbeatInfo.latency = heartbeat.latency
  // heartbeatInfo.serverCommittedMemory = heartbeat.serverCommittedMemory
  // heartbeatInfo.serverCpuCount = heartbeat.serverCpuCount
  // heartbeatInfo.serverCpuLoadAverage = heartbeat.serverCpuLoadAverage
  // heartbeatInfo.serverMaxMemory = heartbeat.serverMaxMemory
  // heartbeatInfo.serverTimestamp = heartbeat.serverTimestamp
  // heartbeatInfo.serverUptime = heartbeat.serverUptime
  // heartbeatInfo.serverUsedMemory = heartbeat.serverUsedMemory
  // heartbeatInfo.sessionCount = heartbeat.sessionCount
  // heartbeatInfo.serverInfo = serverInfo
}
