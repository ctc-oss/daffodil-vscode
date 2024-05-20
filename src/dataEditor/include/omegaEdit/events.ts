import { SessionMetadata } from './Session'

export interface SaveEvent {
  readonly filePath: string
}
export type SessionInfoUpdateEvent = Partial<SessionMetadata>

declare module '../mediator/events' {
  export interface MediatorEvent {
    save: SaveEvent
  }
  export interface MediatorEvent {
    info: SessionInfoUpdateEvent
  }
}
