import { Mediator, MediatorComponent } from '../mediator/mediator'
import { DataEditorEvent } from '../events'

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

export abstract class DataEditorUI extends MediatorComponent<DataEditorEvent> {
  constructor(
    mediator: Mediator<DataEditorEvent>,
    readonly componentId: string
  ) {
    super(mediator)
  }
  protected abstract inputHandler: (event: any) => any
}
