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
export abstract class DataEditorUI extends MediatorComponent {
  constructor(
    mediator: Mediator,
    readonly componentId: string
  ) {
    super(mediator)
  }

  // abstract sendMessage(msg: MediatorNotification<unknown>): void
  //
  // protected abstract inputHandler: UIInputHandler
}

declare module '../mediator/events' {
  export interface MediatorEvent {
    dataUpdate: DataUpdateEvent
  }
  export interface MediatorEvent {
    displaySettingUpdate: DisplaySettingsEvent
  }
}
