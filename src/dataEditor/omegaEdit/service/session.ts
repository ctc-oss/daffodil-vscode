import { EditServiceClient } from '../../core/service/editService'
import { ServiceRequestHandler } from './requestHandler'

export type SessionIdType = ReturnType<OmegaEditSession['id']>

export class OmegaEditSession implements EditServiceClient {
  heartbeatInterval: NodeJS.Timeout | undefined = undefined
  constructor(
    private sessionId: SessionIdType,
    private serviceRequestHandler: (
      session: SessionIdType,
      request: any
    ) => Promise<any>,
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
    const response = await this.serviceRequestHandler(this.sessionId, request)
    this.onDidProcess(response)
    this.onRequestProcessed
  }
}

export class OmegaEditSessionNotifier {
  static Notify(sessionId: SessionIdType, notification: any) {}
}
