import { EditServiceClient } from '../../core/service/editService'

export type SessionIdType = ReturnType<OmegaEditSession['id']>

export class OmegaEditSession implements EditServiceClient {
  heartbeatInterval: NodeJS.Timeout | undefined = undefined
  constructor(
    private sessionId: SessionIdType,
    private serviceRequestHandler: (request: any) => Promise<any>,
    readonly close: () => void
  ) {
    this.heartbeatInterval = setInterval(() => {
      this.request({ command: 'getServerHeartbeat' })
    }, 1000)
  }
  onDidProcess: (response: any) => any = () => {
    throw 'Not Implemented'
  }

  onRequestProcessed: (response: Promise<any>) => any = () => {
    throw 'Not implemented'
  }

  id(): string {
    return this.sessionId
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
