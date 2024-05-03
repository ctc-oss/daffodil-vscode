// - configureOmegaEditPort()
//     - checkServerListening()
//       - setupLogging()
//       - serverStart()
//         - serverStop()
//         - oe::startServer()
//         - getServerInfo()
//         - getHeartbeat()
//       - getClient()
//       - getHeartbeat()

// import net from 'net'
import * as fs from 'fs'
import {
  IHeartbeatReceiver,
  IServerHeartbeat,
  IServerInfo,
  getServerHeartbeat,
  getServerHeartbeatFor,
  getServerInfo,
  pidIsRunning,
  startServer,
  stopProcessUsingPID,
} from '@omega-edit/client'
import path from 'path'
import { APP_DATA_PATH } from '../../config'
import assert from 'assert'
import { HeartbeatProcessor, IHeartbeatInfo } from './heartbeat/HeartBeatInfo'
import { OmegaEditService } from '../service/editorService'

type ServerProcess = {
  pidFile: string
  pid: number
}

export class ServiceHeartbeat {
  readonly interval: number = 1000
  protected intervalId: NodeJS.Timeout
  constructor(
    readonly id: string,
    readonly process: (hb: IServerHeartbeat) => any
  ) {
    this.intervalId = setInterval(() => {
      getServerHeartbeat([], this.interval).then(process)
    }, this.interval)
  }
}
export class ServiceClient {
  constructor() {
    // createSession()
    // createViewport()
  }
}
export class OmegaEditServer {
  readonly host: string
  readonly port: number
  private proc: ServerProcess = { pidFile: '', pid: -1 }
  private info: IServerInfo | undefined = undefined
  constructor(host: string, port: number) {
    this.host = host
    this.port = port
    this.proc.pidFile = getPidFile(this.port)
    this.proc.pid = fs.existsSync(this.proc.pidFile)
      ? parseInt(fs.readFileSync(this.proc.pidFile).toString())
      : -1
  }
  async start(): Promise<void> {
    await this.stop()
    const logConfigFile = generateLogbackConfigFile(
      path.join(APP_DATA_PATH, `serv-${this.port}.log`),
      this.port
    )
    const serverPid = await startServer(
      this.port,
      this.host,
      this.proc.pidFile,
      logConfigFile
    )
    if (serverPid && serverPid > 0) {
      this.proc.pid = serverPid
      await this.verify().catch((failure) => {
        throw failure
      })
      return
    } else throw new Error('Server failed to start correctly')
  }
  // async start(): Promise<void> {
  //   return new Promise(async (resolve, reject) => {
  //     await this.stop()
  //     const logConfigFile = generateLogbackConfigFile(
  //       path.join(APP_DATA_PATH, `serv-${this.port}.log`),
  //       this.port
  //     )
  //     const serverPid = await startServer(
  //       this.port,
  //       this.host,
  //       this.proc.pidFile,
  //       logConfigFile
  //     )
  //     // const serverPid = (await Promise.race([
  //     //   startServer(this.port, this.host, this.proc.pidFile, logConfigFile),
  //     //   new Promise((resolve, reject) => {
  //     //     setTimeout(() => {
  //     //       reject(new Error('Server startup timeout out!'))
  //     //     }, 60 * 1000)
  //     //   }),
  //     // ])) as number | undefined
  //     if (serverPid && serverPid > 0) {
  //       this.proc.pid = serverPid
  //       await this.verify().catch((failure) => {
  //         throw failure
  //       })
  //       resolve()
  //     } else reject('Server failed to start correctly')
  //   })
  // }
  async stop(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.proc.pid > 0 && pidIsRunning(this.proc.pid))
        stopProcessUsingPID(this.proc.pid).then((stopped) => {
          resolve(stopped)
        })
      resolve(true)
    })
  }
  async getService(): Promise<OmegaEditService> {
    return new Promise((resolve, reject) => {
      resolve(new OmegaEditService())
    })
  }
  static createProcessor(
    params: Required<IHeartbeatReceiver>
  ): IHeartbeatReceiver {
    // Register Receiver w/ server registry
    return params as IHeartbeatReceiver
  }
  private async verify(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      for (let i = 1; i <= 10; ++i) {
        try {
          this.info = await getServerInfo()
        } catch (err) {
          console.log(
            `Initializing Ωedit server on port ${this.port} (${i}/60)`
          )
        }
      }
      try {
        this.info = await getServerInfo()
        resolve()
      } catch (err) {
        await this.stop()
        throw new Error('Server failed to initialize')
      }
    })
  }
}

function getPidFile(serverPort: number): string {
  return path.join(APP_DATA_PATH, `serv-${serverPort}.pid`)
}
/**
 * Checks if a server is listening on a given port and host
 * @param port port to check
 * @param host host to check
 * @returns true if a server is listening on the given port and host, false otherwise
 */
// function checkServerListening(port: number, host: string): Promise<boolean> {
//   return new Promise((resolve) => {
//     const socket: net.Socket = new net.Socket()
//     socket.setTimeout(2000) // set a 2-second timeout for the connection attempt
//     socket.on('connect', () => {
//       socket.destroy() // close the connection once connected
//       resolve(true) // server is listening
//     })
//     socket.on('timeout', () => {
//       socket.destroy() // close the connection on timeout
//       resolve(false) // server is not listening
//     })
//     socket.on('error', () => {
//       resolve(false) // server is not listening or an error occurred
//     })
//     socket.connect(port, host)
//   })
// }
/**
 * Removes a directory and all of its contents
 * @param dirPath path to directory to remove
 */
// function removeDirectory(dirPath: string): void {
//   if (fs.existsSync(dirPath)) {
//     fs.readdirSync(dirPath).forEach((file) => {
//       const curPath = `${dirPath}/${file}`
//       if (fs.lstatSync(curPath).isDirectory()) {
//         // Recursively remove subdirectories
//         removeDirectory(curPath)
//       } else {
//         // Delete file
//         fs.unlinkSync(curPath)
//       }
//     })

//     // Remove empty directory
//     fs.rmdirSync(dirPath)
//   }
// }
function generateLogbackConfigFile(
  logFile: string,
  port: number,
  logLevel: string = 'DEBUG'
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
  const logbackConfigFile = path.join(APP_DATA_PATH, `serv-${port}.logconf.xml`)
  rotateLogFiles(logFile)
  fs.writeFileSync(logbackConfigFile, logbackConfig)
  return logbackConfigFile // Return the path to the logback config file
}
const MAX_LOG_FILES = 10
function rotateLogFiles(logFile: string): void {
  interface LogFile {
    path: string
    ctime: Date
  }

  assert(
    MAX_LOG_FILES > 0,
    'Maximum number of log files must be greater than 0'
  )

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
