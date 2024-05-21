import { Mediator } from './mediator'

export class MediatorMap<EventType> implements Mediator<EventType> {
  protected eventHandlers: Map<keyof EventType, (content: any) => void> =
    new Map()
  notify<K extends keyof EventType>(
    type: K,
    event: Required<EventType[K]>
  ): void {
    const handler = this.eventHandlers.get(type)
    if (handler) handler(event)
  }
  register<K extends keyof EventType>(
    type: K,
    handler: (content: EventType[K]) => void
  ): void {
    this.eventHandlers.set(type, handler)
  }
}
