import { DataEditorEvent } from '../../events'
import { Mediator } from '../../mediator/mediator'

export interface MockEvent {}
interface RandomEvent {
  num: number
}
interface StringEvent {
  str: string
}
export interface MockEvent {
  randEvent: RandomEvent
}
export interface MockEvent {
  strEvent: StringEvent
}

export class MappedMediator<EventType> implements Mediator<EventType> {
  eventHandlers: Map<keyof EventType, (event: any) => void> = new Map()
  notify<K extends keyof EventType>(
    type: K,
    event: Required<EventType[K]>
  ): void {
    const handle = this.eventHandlers.get(type)
    if (handle) handle(event)
  }
  register<K extends keyof EventType>(
    type: K,
    handler: (content: EventType[K]) => void
  ): void {
    this.eventHandlers.set(type, handler)
  }
}

export const MockMediator = new MappedMediator<MockEvent>()
export const MockEditorMediator = new MappedMediator<DataEditorEvent>()
