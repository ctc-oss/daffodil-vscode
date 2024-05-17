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

export interface MediatorEvent<T> {
  readonly type: T
  content(): any
  toString(): string
}
export type MediatorEventListener<D> = (content: D) => void
export interface IMediator<T> {
  notify(event: MediatorEvent<T>): void
  register<D>(type: T, handler: MediatorEventListener<D>[]): void
}
export abstract class IMediatorComponent<T> {
  constructor(protected mediator: IMediator<T>) {
    this.registerEventHandlers()
  }
  protected abstract registerEventHandlers(): void
}
