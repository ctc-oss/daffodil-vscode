import { FilePath } from '..'
import { IConfig } from '../../config'

export class Connection {
  constructor(
    readonly host: string,
    readonly port: number
  ) {}
}

export type GetServerConfigStrategy = () => Promise<ServerConfig>
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
