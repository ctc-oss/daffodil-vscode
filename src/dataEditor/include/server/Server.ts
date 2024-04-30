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
  IServerInfo,
  getServerInfo,
  pidIsRunning,
  startServer,
  stopProcessUsingPID,
} from '@omega-edit/client'
import path from 'path'
import { APP_DATA_PATH } from '../../config'

type ServerProcess = {
  pidFile: string
  pid: number
}

export interface INotify {
  info(msg: string): void
  error(msg: string): void
  warning(msg: string): void
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
    return new Promise(async (resolve, reject) => {
      await this.stop()
      const serverPid = (await Promise.race([
        await startServer(this.port, this.host, this.proc.pidFile),
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Server startup timeout out!'))
          }, 60 * 1000)
        }),
      ])) as number | undefined
      if (serverPid && serverPid > 0) {
        this.proc.pid = serverPid
        await this.verify().catch((failure) => {
          throw failure
        })
        resolve()
      } else reject('Server failed to start correctly')
    })
  }
  async stop(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.proc.pid > 0 && pidIsRunning(this.proc.pid))
        stopProcessUsingPID(this.proc.pid).then((stopped) => {
          resolve(stopped)
        })
      resolve(true)
    })
  }
  private async verify(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      for (let i = 1; i <= 60; ++i) {
        try {
          this.info = await getServerInfo()
        } catch (err) {
          console.log(
            `Initializing Ωedit server on port ${this.port} (${i}/60)`
          )
        } // wait 1 second before trying again
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(true)
          }, 1000)
        })
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
