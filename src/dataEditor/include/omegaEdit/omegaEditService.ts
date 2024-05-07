import { createSession } from '@omega-edit/client'
import { IEditService, IServiceMediator } from '../service/editorService'
import { Session } from './Session'
import { Viewport } from './Viewport'

export class OmegaEditService extends IEditService {
  static ViewportCapacity = 1024
  private session: Session | undefined = undefined

  constructor(mediator: IServiceMediator) {
    super(mediator)
  }
  request(msg: { type: string; data: any }) {
    console.debug(`OmegaEditService received request ${msg.type}`)
  }
  async set(editingFile: string) {
    try {
      this.session = new Session(await createSession(editingFile), (data) => {
        this.mediator.notify({
          id: 'session-info-update',
          data: data,
        })
      })
      this.session.createViewport(
        0,
        OmegaEditService.ViewportCapacity,
        (event) => {
          this.mediator.notify({
            id: 'viewport-updated',
            data: event,
          })
        }
      )
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
  // async scrollViewport(
  //   offset: number,
  //   onViewportUpdate: (viewport: Viewport) => void
  // ) {
  //   const first = this.session?.getViewports()[0]
  //   modifyViewport(first!.id, offset, OmegaEditService.ViewportCapacity).then(
  //     (response) => {
  //       const viewport = this.session?.getViewports().find((vp) => {
  //         return vp.id == response.getViewportId()
  //       })
  //       onViewportUpdate(viewport!)
  //     }
  //   )
  // }
}
// service requires a running server
