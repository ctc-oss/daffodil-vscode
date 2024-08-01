import {
  ALL_EVENTS,
  createSession,
  createViewport,
  CreateViewportRequest,
  EditorClient,
  EventSubscriptionRequest,
  getClient,
  getCounts,
  getServerHeartbeat,
  getViewportData,
  IServerHeartbeat,
  IServerInfo,
  resumeViewportEvents,
  ViewportDataRequest,
  ViewportEvent,
  ViewportEventKind,
} from '@omega-edit/client'
import { FilePath } from '..'
import { EditService } from '../../core/service/editService'
import { OmegaEditSession, SessionIdType } from './session'
import EventEmitter from 'events'
import { Heartbeat } from '../server/heartbeat'
import { ServiceRequestHandler } from './requests.ts/requestHandler'
import { MessageCommand } from '../../../svelte/src/utilities/message'

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
  constructor(
    private client: EditorClient,
    private heartbeat_: Heartbeat,
    readonly serviceInfo: ServiceInfo,
    readonly checkpointDirectory: FilePath = FilePath.SystemTmpDirectory()
  ) {
    this.Events.on('allSessionsClosed', () => {
      clearInterval(this.heartbeatInterval)
    })
  }
  onAllSessionsClosed(listener: () => void) {
    this.Events.on('allSessionsClosed', () => {
      listener()
    })
  }

  register(source: FilePath): Promise<OmegaEditSession> {
    if (this.activeSessions.size == 0) {
      this.heartbeat_.start(() => {
        return this.sessionIds()
      })
    }
    return new Promise(async (res, rej) => {
      const session = await this.createSession(source, this.checkpointDirectory)
      const response = await createViewport(
        undefined,
        session.id(),
        0,
        1024,
        false
      )
      const vpId = response.getViewportId()
      this.client
        .subscribeToViewportEvents(
          new EventSubscriptionRequest()
            .setId(response.getViewportId())
            .setInterest(ALL_EVENTS & ~ViewportEventKind.VIEWPORT_EVT_MODIFY)
        )
        .on('data', (data: ViewportEvent) => {
          const vpdata = data.getData_asU8()
          console.log(`got vpdata: ${vpdata}`)
          session.onDidProcess({
            command: MessageCommand.viewportRefresh,
            data: data.getData_asU8(),
          })
        })
        .on('error', (err) => {
          console.log('Viewport Subscribe err: ', err)
        })
      getViewportData(vpId).then((r) => {
        session.onDidProcess({
          command: 20,
          data: {
            viewportData: r.getData_asU8(),
            viewportOffset: r.getOffset(),
            viewportLength: r.getLength(),
            viewportFollowingByteCount: r.getFollowingByteCount(),
          },
        })
      })
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

      const requestHandlerFn = async (req) => {
        return this.requestHandler(req)
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
  private requestHandler(request: any): Promise<any> {
    switch (request.command) {
      case 'getFileInfo':
        return ServiceRequestHandler.getHandle('getFileInfo')(
          request.sessionId,
          this.activeSessions.get(request.sessionId)!
        )
      case 'getServerHeartbeat':
        return new Promise((res, rej) => {
          res({
            command: 4,
            data: { ...this.heartbeat_.getLast(), ...this.serviceInfo },
          })
        })
      default:
        return new Promise((_, rej) => {
          rej(`Unknown request command: ${request.command}`)
        })
    }
  }
}
