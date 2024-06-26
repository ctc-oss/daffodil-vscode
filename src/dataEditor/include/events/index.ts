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

export type EditedDataRequest = {
  offset: number
  editedContentStr: string
  viewportId: string
  selectionSize: number
  encoding: string
  radix: 2 | 8 | 10 | 16
  editMode: 'single' | 'multiple'
}
export interface DataEditorEvent {
  requestEditedData: EditedDataRequest
}

export type ViewportSeek = {
  targetOffset: number
  bytesPerRow: number
  displayLineCount: number
}
export interface DataEditorEvent {
  seek: ViewportSeek
}
