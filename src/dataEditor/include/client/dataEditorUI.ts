import { IEditorComponent, IEditorMediator } from '../service/editorService'

export type UIInputHandler = (input: any) => any
export abstract class DataEditorUI extends IEditorComponent {
  constructor(
    mediator: IEditorMediator,
    readonly componentId: string
  ) {
    super(mediator, componentId)
  }
  protected abstract inputHandler: UIInputHandler
  abstract sendMessage(msg: any): void
}
