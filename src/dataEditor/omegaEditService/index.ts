import { EditService, EditServiceProvider } from '../core/service'
import { OmegaEditService } from './service'
import { Disposable } from 'vscode'
import XDGAppPaths from 'xdg-app-paths'
import path from 'path'
import { ServerProcess } from './server'

import * as fs from 'fs'
import {
  pidIsRunning,
  startServer,
  stopProcessUsingPID,
} from '@omega-edit/client'

const APP_DATA_PATH: string = XDGAppPaths({ name: 'omega_edit' }).data()
export interface DisposableService extends EditService, Disposable {}
class OmegaEditServer implements EditServiceProvider {
  constructor(
    readonly conn: Connection = DefaultConnection,
    readonly process: ServerProcess
  ) {
    // this.process.pidFilePath = getPidFilePath(conn.port)
    // this.process.pid = fs.existsSync(this.process.pidFilePath)
    //   ? parseInt(fs.readFileSync(this.process.pidFilePath).toString())
    //   : -1
    ActiveConnections.set(conn, process)
  }

  getService(): Promise<OmegaEditService> {
    return new Promise((resolve, reject) => {
      resolve(
        new OmegaEditService(() => {
          Remove(this)
        })
      )
    })
  }
}

function getPidFilePath(serverPort: number): string {
  return path.join(APP_DATA_PATH, `serv-${serverPort}.pid`)
}

export type Connection = { readonly host: string; readonly port: number }
const DefaultConnection: Connection = { host: '127.0.0.1', port: 9000 }

export class OmegaEditServerManager {
  static Connect(conn?: Connection): Promise<OmegaEditServer> {
    return new Promise(async (resolve, reject) => {
      if (connectionExists(conn)) {
      } else {
        const server = await Start(conn)
        resolve(server)
      }
    })
  }
}
const ActiveConnections: Map<Connection, ServerProcess> = new Map()
function Remove(server: OmegaEditServer) {
  ActiveConnections.delete(server.conn)
  if (ActiveConnections.size <= 0) Stop(server.process)
}
function connectionExists(conn?: Connection): boolean {
  return conn !== undefined && ActiveConnections.get(conn) !== undefined
}
async function Stop(server: ServerProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server.pid > 0 && pidIsRunning(server.pid)) {
      stopProcessUsingPID(server.pid)
        .then((stopped) => {
          resolve()
        })
        .catch((failure) => {
          reject(failure)
        })
    }
  })
}
async function Start(conn?: Connection): Promise<OmegaEditServer> {
  return new Promise(async (resolve, reject) => {
    const process: ServerProcess = { pid: -1, pidFilePath: '' }
    conn = conn ? conn : DefaultConnection
    startServer(conn.port, conn.host).then((pid) => {
      if (!pid) reject(`Server Start failed for ${conn}`)
      else {
        process.pid = pid
        process.pidFilePath = getPidFilePath(pid)
        resolve(new OmegaEditServer(conn, process))
      }
    })
  })
}
