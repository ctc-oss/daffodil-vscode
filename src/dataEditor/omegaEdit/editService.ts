import { createSession } from '@omega-edit/client'
import { FilePath, FilePathSourceStrategy } from '.'
import { EditService, ServiceUser } from '../core/service/editService'
import { Session } from './session'
export class OmegaEditSession {
  constructor(readonly id: string) {}
}
export type HeartbeatProvider = () => Promise<{}>
export interface OmegaEditServiceClient {
  readonly session: Session
  onDidReceiveHeartbeat: () => any
  request(type: string): any
}

// Service handles multiple ServiceUsers (Session)
export class OmegaEditService implements EditService {
  constructor() {}
  // activeSessions: Map<OmegaEditServiceClient, Session> = new Map()
  activeSessions: Session[] = []
  register(source: FilePath): Promise<void> {
    /* register client to receive heartbeats */
    return new Promise(async (res, rej) => {
      const session = await this.createSession(source)
      // this.activeSessions.set(client, session)
      this.activeSessions.push(session)
      res()
    })
  }
  activeUsers(): number {
    throw new Error('Method not implemented.')
  }

  private createSession(file: FilePath): Promise<Session> {
    return new Promise(async (res, rej) => {
      const { getSessionId } = await createSession(
        file.fullPath(),
        undefined,
        undefined /* need config */
      )
      res(new Session(getSessionId()))
    })
  }
}
