import { MediatorEvent } from '../mediator/events'
import { Mediator } from '../mediator/mediator'

export class MappedMediator implements Mediator {
  protected eventHandlers: Map<keyof MediatorEvent, (content: any) => void> =
    new Map()
  notify<K extends keyof MediatorEvent>(
    type: K,
    event: Required<MediatorEvent[K]>
  ): void {
    const handler = this.eventHandlers.get(type)
    if (handler) handler(event)
  }
  register<K extends keyof MediatorEvent>(
    type: K,
    handler: (content: MediatorEvent[K]) => void
  ): void {
    this.eventHandlers.set(type, handler)
  }
}
