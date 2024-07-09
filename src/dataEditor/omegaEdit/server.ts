import { OmegaEditService } from './editService'

export class Connection {
  constructor(
    readonly host: string,
    readonly port: number
  ) {}
}
export class OmegaEditServer {
  constructor(readonly conn: Connection) {}
  getService(): Promise<OmegaEditService> {
    return new Promise((res) => {})
  }
}

export class OmegaEditServerManager {
  static Connect(conn: Connection): Promise<OmegaEditServer> {
    return new Promise((res) => {
      res(new OmegaEditServer(conn))
    })
  }
}
