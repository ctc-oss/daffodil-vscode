import { SessionMetadata } from '../omegaEdit/Session'
import { ViewportContent } from '../omegaEdit/Viewport'

export interface DataEditorEvent {}
export interface SaveEvent {
  readonly filePath: string
}
export type SessionInfoUpdateEvent = Partial<SessionMetadata>
export type ViewportRefresh = {
  [K in keyof ViewportContent]: ViewportContent[K]
}
export interface DataEditorEvent {
  save: SaveEvent
}
export interface DataEditorEvent {
  info: SessionInfoUpdateEvent
}
export interface DataEditorEvent {
  viewportRefresh: ViewportRefresh
}
