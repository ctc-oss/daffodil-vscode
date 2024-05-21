import { createSession } from '@omega-edit/client'
import { Session } from './Session'
import { Mediator } from '../mediator/mediator'
import { IEditService } from '../service/editorService'
import { DataEditorEvent } from '../events'

export class OmegaEditService extends IEditService<DataEditorEvent> {
  protected registerEventHandlers(): void {
    this.mediator.register('save', (content) => {
      console.log(`Saving editor content to: ${content.filePath}`)
    })
  }
  static ViewportCapacity = 1024
  private session: Session | undefined = undefined

  constructor(
    mediator: Mediator<DataEditorEvent>,
    readonly onDisposal: () => any
  ) {
    super(mediator, onDisposal, 'OmegaEditorService')
  }
  [Symbol.dispose](): void {
    throw new Error('Method not implemented.')
  }
  async setDataSource(editingFile: string) {
    const response = await createSession(editingFile)
    this.session = await Session.FromResponse(response, (metadata) => {
      this.mediator.notify('info', { ...metadata })
    })
    this.session.createViewport(0, (data) => {
      this.mediator.notify('viewportRefresh', data.getContent())
    })
  }
}
