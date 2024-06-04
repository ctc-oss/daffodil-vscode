import { Mediator, MediatorComponent } from '../mediator/mediator'

export class DataUpdateEvent {
  constructor(readonly binData: Uint8Array) {}
}
export type DisplayRadix = 2 | 8 | 10 | 16
export interface DisplaySettings {
  readonly radix: DisplayRadix
}
export interface DisplaySettingsEvent {
  readonly settings: DisplaySettings
}
export abstract class DataEditorUI<
  EventType,
> extends MediatorComponent<EventType> {
  constructor(
    mediator: Mediator<EventType>,
    readonly componentId: string
  ) {
    super(mediator)
  }
  // protected abstract inputHandler: (event: any) => any
}
