import { FilePath } from '..'
import { OmegaEditService } from '../service/editService'
import path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import {
  getClientVersion,
  getServerHeartbeat,
  getServerInfo,
  IServerHeartbeat,
  IServerInfo,
  startServer,
  stopProcessUsingPID,
} from '@omega-edit/client'
import { IConfig } from '../../config'
import { IHeartbeatInfo } from '../../include/server/heartbeat/HeartBeatInfo'
import { ServerConfig } from './config'
import {
  APP_DATA_PATH,
  generateLogbackConfigFile,
  setupLogging,
} from './logging'
import { Heartbeat } from './heartbeat'

const activeServers: Map<ServerConfig, OmegaEditServer> = new Map()
const ServerDisposeAll = {
  dispose: () => {
    activeServers.forEach((server) => {
      server.dispose()
    })
  },
}

export class OmegaEditServer {
  private service: OmegaEditService

  constructor(
    readonly config: ServerConfig,
    readonly serverInfo: IServerInfo
  ) {
    const heartbeat = new Heartbeat(getServerHeartbeat)
    this.service = new OmegaEditService( // send whole config?
      heartbeat,
      { server: this.serverInfo, port: config.conn.port },
      new FilePath(config.checkpointPath)
    )
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

export class OmegaEditServerManager {
  static Connect(config: () => IConfig): Promise<OmegaEditServer> {
    return new Promise(async (res, rej) => {
      const serverConfig = new ServerConfig(config)
      const loggerSetupComplete = setupLogging(serverConfig)
      const query = activeServers.get(serverConfig)
      if (query) res(query)

      await loggerSetupComplete
      await serverStart(serverConfig, (info) => {
        res(new OmegaEditServer(serverConfig, info))
      })
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
async function serverStart(
  server: ServerConfig,
  callback: (info: IServerInfo) => any
) {
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
  callback(serverInfo)
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
