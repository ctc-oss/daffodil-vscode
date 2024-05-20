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

export type MediatorEventType = string | number
export interface MediatorEvent<T extends MediatorEventType> {
  readonly type: T
  content(): any
  toString(): string
}

export type MediatorEventListener<D> = (content: D) => void

export interface Mediator<T extends MediatorEventType> {
  notify(event: MediatorEvent<T>): void
  register<D>(type: T, handler: MediatorEventListener<D>[]): void
}

export abstract class MediatorComponent<T extends MediatorEventType> {
  constructor(protected mediator: Mediator<T>) {
    this.registerEventHandlers()
  }
  protected abstract registerEventHandlers(): void
}
