import {
  IEditorComponent,
  IEditorMediator,
  MediatorNotification,
} from '../mediator/editorMediator'

export type UIInputHandler = (input: MediatorNotification<any>) => any
export abstract class DataEditorUI extends IEditorComponent {
  constructor(
    mediator: IEditorMediator,
    readonly componentId: string
  ) {
    super(mediator, componentId)
  }

  abstract sendMessage(msg: MediatorNotification<unknown>): void

  protected abstract inputHandler: UIInputHandler
}
