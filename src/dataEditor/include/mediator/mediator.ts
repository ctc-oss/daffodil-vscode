export interface Mediator<E> {
  notify<K extends keyof E>(type: K, event: E[K]): void
  register<K extends keyof E>(type: K, handler: (content: E[K]) => void): void
}
export abstract class MediatorComponent<E> {
  constructor(protected mediator: Mediator<E>) {
    this.registerEventHandlers()
  }
  protected abstract registerEventHandlers(): void
}
