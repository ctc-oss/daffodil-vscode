import EventEmitter from 'events'

export interface OmegaEditEvent {
  response: any
}
export interface OmegaEditEvent {
  test: { num: number; name: string }
}

export class OmegaEditEventManager {
  private Events: EventEmitter = new EventEmitter()
  on<E extends keyof OmegaEditEvent>(
    type: E,
    listener: (resp: OmegaEditEvent[E]) => any
  ) {
    this.Events.on(type, listener)
  }
  constructor() {}
}
