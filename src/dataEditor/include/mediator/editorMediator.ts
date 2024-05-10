import { NotificationType } from './notification'

export interface MediatorNotification<T> {
  readonly command: NotificationType
  data: T
}

export interface IEditorMediator {
  notify<T>(notification: MediatorNotification<T>, from: IEditorComponent): any
}
export abstract class IEditorComponent {
  constructor(
    protected mediator: IEditorMediator,
    readonly componentId: string
  ) {}
}
