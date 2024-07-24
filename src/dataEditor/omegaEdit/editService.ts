import { createSession, getCounts, IServerHeartbeat } from '@omega-edit/client'
import { FilePath, FilePathSourceStrategy } from '.'
import {
  EditService,
  EditServiceClient,
  ServiceUser,
} from '../core/service/editService'
import { Session } from './session'
import EventEmitter from 'events'

export class OmegaEditSession implements EditServiceClient {
  constructor(
    private sessionId: SessionIdType,
    private serviceRequestHandler: (
      session: SessionIdType,
      request: any
    ) => Promise<any>,
    readonly close: () => void
  ) {}
  onDidProcessRequest: (response: any) => any = () => {
    throw 'Not Implemented'
  }
  id(): string {
    return this.sessionId
  }
  async request(request: any) {
    const response = await this.serviceRequestHandler(this.sessionId, request)
    this.onDidProcessRequest(response)
  }
}

type SessionIdType = ReturnType<OmegaEditSession['id']>
// Service handles multiple ServiceUsers (Session)
export class OmegaEditService implements EditService {
  constructor() {}
  private Events: EventEmitter = new EventEmitter()
  onAllSessionsClosed(listener: () => void) {
    this.Events.on('allSessionsClosed', () => {
      listener()
    })
  }
  activeSessions: Map<SessionIdType, FilePath> = new Map()
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
      this.activeSessions.set(id, file)
      res(
        new OmegaEditSession(
          id,
          async (id, req) => {
            return this.requestHandler(id, req)
          },
          () => {
            this.removeSession(id)
          }
        )
      )
    })
  }
  private removeSession(sessionId: SessionIdType) {
    this.activeSessions.delete(sessionId)
    if (this.activeSessions.size == 0) this.Events.emit('allSessionsClosed')
  }
  private requestHandler(sessionId: SessionIdType, request: any): Promise<any> {
    console.log(`received request ${{ ...request }}`)
    return new Promise(async (res, rej) => {
      if (request.command === 'getFileInfo') {
        const count = await getCounts(sessionId, [
          1, //CountKind.COUNT_COMPUTED_FILE_SIZE,
          7, //CountKind.COUNT_CHANGE_TRANSACTIONS,
          8, //CountKind.COUNT_UNDO_TRANSACTIONS,
        ])
        const file = this.activeSessions.get(sessionId)
        let data = {
          fileName: file ? file.fullPath() : 'No file',
          computedFileSize: 0,
          changeCount: 0,
          undoCount: 0,
        }
        count.forEach((count) => {
          switch (count.getKind()) {
            case 1: //CountKind.COUNT_COMPUTED_FILE_SIZE:
              data.computedFileSize = count.getCount()
              break
            case 7: //CountKind.COUNT_CHANGE_TRANSACTIONS:
              data.changeCount = count.getCount()
              break
            case 8: //CountKind.COUNT_UNDO_TRANSACTIONS:
              data.undoCount = count.getCount()
              break
          }
        })
        res({ command: 3, data: data })
      }
      rej({ msg: `no ${request.command} handler found` })
    })
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
