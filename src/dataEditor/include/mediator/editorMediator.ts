import { NotificationType } from './notification'

export interface MediatorNotification {
  readonly command: NotificationType
  data: Record<string, any>
}

export interface IEditorMediator {
  notify(notification: MediatorNotification, from: IEditorComponent): any
}
export abstract class IEditorComponent {
  constructor(
    protected mediator: IEditorMediator,
    readonly componentId: string
  ) {}
}
