import {
  createSession,
  getCounts,
  getServerHeartbeat,
  IServerHeartbeat,
  IServerInfo,
} from '@omega-edit/client'
import { FilePath } from '..'
import { EditService } from '../../core/service/editService'
import { OmegaEditSession, SessionIdType } from './session'
import EventEmitter from 'events'
import { OmegaEditEvent, OmegaEditEventManager } from './serviceEvents'

const InitialHeartbeat: IServerHeartbeat = {
  latency: 0,
  sessionCount: 0,
  serverTimestamp: 0,
  serverUptime: 0,
  serverCpuCount: 0,
  serverCpuLoadAverage: 0,
  serverMaxMemory: 0,
  serverCommittedMemory: 0,
  serverUsedMemory: 0,
}
export interface ServiceInfo {
  server: IServerInfo
  port: number
}
// Service handles multiple ServiceUsers (Session)
export class OmegaEditService implements EditService {
  private Events: EventEmitter = new EventEmitter()
  private activeSessions: Map<SessionIdType, FilePath> = new Map()
  private heartbeat: IServerHeartbeat = InitialHeartbeat
  private heartbeatInterval: NodeJS.Timeout | undefined = undefined
  private eventManager = new OmegaEditEventManager()
  constructor(
    readonly serviceInfo: ServiceInfo,
    readonly checkpointDirectory: FilePath = FilePath.SystemTmpDirectory()
  ) {
    // this.addListenerToEvent()
  }
  addListenerToEvent<E extends keyof OmegaEditEvent>(
    event: E,
    listener: (resp) => any
  ) {
    this.eventManager.on(event, listener)
  }
  onAllSessionsClosed(listener: () => void) {
    clearInterval(this.heartbeatInterval)
    this.Events.on('allSessionsClosed', () => {
      listener()
    })
  }

  register(source: FilePath): Promise<OmegaEditSession> {
    if (this.activeSessions.size == 0) {
      const intervalMsMultiplier =
        this.activeSessions.size <= 0 ? 1 : this.activeSessions.size
      // Heartbeat.Start(() => {
      //   return this.sessionIds()
      // })

      this.heartbeatInterval = setInterval(() => {
        getServerHeartbeat(this.sessionIds(), 1000)
          .catch((err) => {
            throw err
          })
          .then((heartbeat) => {
            this.heartbeat = heartbeat
          })
      }, intervalMsMultiplier * 1000)
    }
    return new Promise(async (res, rej) => {
      const session = await this.createSession(source, this.checkpointDirectory)

      res(session)
    })
  }

  sessionCount() {
    return this.activeSessions.size
  }
  private sessionIds() {
    const ret: SessionIdType[] = []
    for (const id in this.activeSessions.keys()) ret.push(id)
    return ret
  }
  private createSession(
    file: FilePath,
    checkpointPath: FilePath
  ): Promise<OmegaEditSession> {
    return new Promise(async (res, rej) => {
      const response = await createSession(
        file.fullPath(),
        undefined,
        checkpointPath.fullPath() /* need config */
      )
      const id = response.getSessionId()
      this.activeSessions.set(id, file)
      const requestHandlerFn = async (id, req) => {
        return this.requestHandler(id, req)
      }
      const sessionCloseCallback = () => {
        this.removeSession(id)
      }
      res(new OmegaEditSession(id, requestHandlerFn, sessionCloseCallback))
    })
  }

  private removeSession(sessionId: SessionIdType) {
    this.activeSessions.delete(sessionId)
    if (this.activeSessions.size == 0) this.Events.emit('allSessionsClosed')
  }

  /** Extract this functionality to another class */
  private requestHandler(sessionId: SessionIdType, request: any): Promise<any> {
    console.log(`received request ${{ ...request }}`)
    return new Promise(async (res, rej) => {
      if (request.command === 'getServerHeartbeat') {
        res({
          command: 4,
          data: { ...this.heartbeat, ...this.serviceInfo },
        })
      }
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
}
