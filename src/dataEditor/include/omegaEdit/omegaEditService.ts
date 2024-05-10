import { createSession } from '@omega-edit/client'
import { Session } from './Session'
import { Viewport } from './Viewport'
import { IEditorMediator } from '../mediator/editorMediator'
import { IEditService } from '../service/editorService'
import { NotificationType } from '../mediator/notification'

export class OmegaEditService extends IEditService {
  static ViewportCapacity = 1024
  private session: Session | undefined = undefined

  constructor(mediator: IEditorMediator) {
    super(mediator, 'OmegaEditorService')
  }
  request(msg: { type: string; data: any }) {
    console.debug(`OmegaEditService received request ${msg.type}`)
  }
  async setDataSource(editingFile: string) {
    const response = await createSession(editingFile)
    this.session = await Session.FromResponse(response, (metadata) => {
      this.mediator.notify(
        { command: NotificationType.fileInfo, data: metadata },
        this
      )
    })
    this.session.createViewport(0, (data) => {
      this.mediator.notify(
        {
          command: NotificationType.viewportRefresh,
          data: {
            viewportData: data.binaryData(),
            fileOffset: data.offset(),
            length: data.length(),
            bytesLeft: 0,
          },
        },
        this
      )
    })
  }
  async destroy() {}
  getViewport(byId: string): Viewport | undefined {
    if (byId === '') return this.session?.getViewports()[0]
    return this.session?.getViewports().find((vp) => {
      return vp.id === byId
    })
  }
}
