import {
  MessageCommand,
  ServiceRequest,
} from '../../../svelte/src/utilities/message'
import { EditServiceClient } from '../../core/service/editService'

export type SessionIdType = ReturnType<OmegaEditSession['id']>

export class OmegaEditSession implements EditServiceClient {
  heartbeatInterval: NodeJS.Timeout | undefined = undefined
  private responseBacklog: any[] = []
  private requestResponseCallbacks: ((response: any) => any)[] = []

  constructor(
    private sessionId: SessionIdType,
    private serviceRequestHandler: (request: ServiceRequest) => Promise<any>,
    readonly onClose: () => void
  ) {
    this.heartbeatInterval = setInterval(() => {
      this.request({ command: MessageCommand.heartbeat })
    }, 1000)
  }

  id(): string {
    return this.sessionId
  }

  addResponseListener(listener: (response: any) => any) {
    this.requestResponseCallbacks.push(listener)
  }

  async request(request: ServiceRequest) {
    const sessionRequest = { ...request, sessionId: this.sessionId }
    const response = await this.serviceRequestHandler(sessionRequest)
    if (response) this.onDidProcess(response)
  }

  close() {
    clearInterval(this.heartbeatInterval)
    this.requestResponseCallbacks = []
    this.responseBacklog = []
    this.onClose()
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
}
