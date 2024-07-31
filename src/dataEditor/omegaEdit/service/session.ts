import { EditServiceClient } from '../../core/service/editService'

export type SessionIdType = ReturnType<OmegaEditSession['id']>

export class OmegaEditSession implements EditServiceClient {
  heartbeatInterval: NodeJS.Timeout | undefined = undefined
  private responseBacklog: any[] = []
  private requestResponseCallbacks: ((response: any) => any)[] = []

  viewportCreate: () => void = () => {
    throw 'Err No Viewport Creation Strategy'
  }

  constructor(
    private sessionId: SessionIdType,
    private serviceRequestHandler: (request: any) => Promise<any>,
    readonly close: () => void
  ) {
    this.heartbeatInterval = setInterval(() => {
      this.request({ command: 'getServerHeartbeat' })
    }, 1000)
  }
  onDidProcess(response: any) {
    if (this.requestResponseCallbacks.length === 0)
      this.responseBacklog.push(response)
    else {
      if (this.responseBacklog.length > 0) {
        this.responseBacklog.forEach((response) => {
          this.notifyListeners(response)
        })
      }
      this.requestResponseCallbacks.forEach((notify) => {
        notify(response)
      })
    }
  }
  private notifyListeners(response: any) {
    this.requestResponseCallbacks.forEach((notify) => {
      notify(response)
    })
  }
  onRequestProcessed: (response: Promise<any>) => any = () => {
    throw 'Not implemented'
  }

  id(): string {
    return this.sessionId
  }
  addResponseListener(listener: (response: any) => any) {
    this.requestResponseCallbacks.push(listener)
  }
  async request(request: any, decorator?: (response: any) => any) {
    const sessionRequest = { ...request, sessionId: this.sessionId }
    const response = await this.serviceRequestHandler(sessionRequest)
    this.onDidProcess(response)
    this.onRequestProcessed
  }
}

export class OmegaEditSessionNotifier {
  static Notify(sessionId: SessionIdType, notification: any) {}
}
