import { EditorClient, createSession, getClient } from '@omega-edit/client'
import { IEditService, IServiceMediator } from '../service/editorService'
import { Session } from './Session'

export class OmegaEditService extends IEditService {
  private session: Session | undefined = undefined

  constructor(
    mediator: IServiceMediator,
    private client: EditorClient
  ) {
    super(mediator)
  }
  async set(editingFile: string) {
    try {
      this.session = new Session(await createSession(editingFile), (data) => {
        this.mediator.notify({
          id: 'session-info-update',
          data: data,
        })
      })
      this.session.createViewport(this.client, 0, 1024, (event) => {
        this.mediator.notify({
          id: 'viewport-updated',
          data: event,
        })
      })
    } catch {
      throw new Error('Could not setup Omegaeditservice')
    }
  }
  async destroy() {}
}
// service requires a running server
