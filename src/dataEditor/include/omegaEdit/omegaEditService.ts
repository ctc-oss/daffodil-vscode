import { createSession } from '@omega-edit/client'
import { Session } from './Session'
import { Viewport } from './Viewport'
import { IEditorMediator } from '../mediator/editorMediator'
import { IEditService } from '../service/editorService'

export class OmegaEditService extends IEditService {
  static ViewportCapacity = 1024
  private session: Session | undefined = undefined

  constructor(mediator: IEditorMediator) {
    super(mediator, 'OmegaEditor')
  }
  request(msg: { type: string; data: any }) {
    console.debug(`OmegaEditService received request ${msg.type}`)
  }
  async set(editingFile: string) {
    createSession(editingFile, undefined, undefined).then((response) => {
      this.session = new Session(response)
    })
    try {
      this.session = new Session(
        editingFile,
        await createSession(editingFile),
        (data) => {
          this.mediator.notify(this, {
            id: 'session-info-update',
            data: data,
          })
        }
      )
      this.session.createViewport(0, (event: Viewport) => {
        this.mediator.notify(this, {
          id: 20,
          data: {
            viewportData: event.binaryData(),
            length: event.length(),
            viewportOffset: event.offset(),
          },
        })
      })
    } catch {
      throw new Error('Could not setup Omegaeditservice')
    }
  }
  async destroy() {}
  getViewport(byId: string): Viewport | undefined {
    if (byId === '') return this.session?.getViewports()[0]
    return this.session?.getViewports().find((vp) => {
      return vp.id === byId
    })
  }
}
