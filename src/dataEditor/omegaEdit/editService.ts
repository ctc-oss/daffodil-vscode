import { createSession, IServerHeartbeat } from '@omega-edit/client'
import { FilePath, FilePathSourceStrategy } from '.'
import {
  EditService,
  EditServiceClient,
  ServiceUser,
} from '../core/service/editService'
import { Session } from './session'

export class OmegaEditSession implements EditServiceClient {
  constructor(
    private sessionId: string,
    readonly request: (request: any) => any
  ) {}
  id(): string {
    return this.sessionId
  }
}

// Service handles multiple ServiceUsers (Session)
export class OmegaEditService implements EditService {
  constructor() {}
  activeSessions: OmegaEditSession[] = []
  register(source: FilePath): Promise<OmegaEditSession> {
    /* register client to receive heartbeats */
    return new Promise(async (res, rej) => {
      const session = await this.createSession(source)
      // this.activeSessions.set(client, session)
      // this.activeSessions.push(session)
      res(session)
    })
  }
  activeUsers(): number {
    throw new Error('Method not implemented.')
  }

  private createSession(file: FilePath): Promise<OmegaEditSession> {
    return new Promise(async (res, rej) => {
      const response = await createSession(
        file.fullPath(),
        undefined,
        undefined /* need config */
      )
      const id = response.getSessionId()
      res(
        new OmegaEditSession(id, (req) => {
          this.requestHandler(req)
        })
      )
    })
  }
  private requestHandler(request: any) {
    console.log(`received request ${request}`)
  }
  // sessionCount() {
  //   return this.activeSessions.length
  // }
  // activeSessionIds(): string[] {
  //   let ret: string[] = []
  //   this.activeSessions.forEach((session) => {
  //     ret.push(session.id)
  //   })
  //   return ret
  // }
}
