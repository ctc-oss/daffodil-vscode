import {
  EditorMessageId,
  EditorMessageIds,
  ExtensionMessageId,
} from './messageIds'
import {
  ApplyChangesRequest,
  ChangesInfoResponse,
  CountResponse,
  EditedDataRequest,
  EditedDataResponse,
  EditorOnChangeRequest,
  EditorOnChangeResponse,
  FileInfoResponse,
  NotificationRequest,
  ProfileRequest,
  ProfileResponse,
  ReplaceRequest,
  ReplaceResponse,
  SaveAsResponse,
  SaveRequest,
  SaveSegmentRequest,
  ScrollViewportRequest,
  SearchRequest,
  SearchResponse,
  SetUIThemeRequest,
  UndoRequest,
  ViewportRefreshResponse,
} from './messages'

type MessageCommands =
  | 'clearChanges'
  | 'applyChanges'
  | 'editorOnChange'
  | 'fileInfo'
  | 'heartbeat'
  | 'profile'
  | 'redoChange'
  | 'replaceResults'
  | 'requestEditedData'
  | 'save'
  | 'saveAs'
  | 'saveSegment'
  | 'scrollViewport'
  | 'search'
  | 'replace'
  | 'setUITheme'
  | 'showMessage'
  | 'undoChange'
  | 'viewportRefresh'

export interface MessageCommandMap {
  counts: never
  clearChanges: never
  applyChanges: ApplyChangesRequest
  editorOnChange: EditorOnChangeRequest
  fileInfo: never // service
  heartbeat: never // service
  profile: ProfileRequest // service
  redoChange: never
  replaceResults: never
  requestEditedData: EditedDataRequest
  save: SaveRequest
  saveAs: SaveRequest
  saveSegment: SaveSegmentRequest
  scrollViewport: ScrollViewportRequest
  search: SearchRequest
  replace: ReplaceRequest
  undoChange: UndoRequest
  viewportRefresh: never
  showMessage: NotificationRequest
  setUITheme: SetUIThemeRequest
}

type MessageRequestMap<Keys extends string[][number]> = { [k in Keys]: any }
export type DataEditorMessageKeys = Exclude<
  MessageCommands,
  'showMessage' | 'setUITheme' | 'editorOnChange'
>
export type DataEditorMessageRequests = Pick<
  MessageCommandMap,
  DataEditorMessageKeys
>

/**
 * Key indexable interface to templated type inference of available messages sent between
 * the components of the DFDL VSCode extension.
 */
// export interface DataEditorMessageRequests
//   extends MessageRequestMap<EditorMessageId> {
//   counts: never
//   clearChanges: never
//   applyChanges: ApplyChangesRequest
//   editorOnChange: EditorOnChangeRequest
//   fileInfo: never // service
//   heartbeat: never // service
//   profile: ProfileRequest // service
//   redoChange: never
//   replaceResults: never
//   requestEditedData: EditedDataRequest
//   save: SaveRequest
//   saveAs: SaveRequest
//   saveSegment: SaveSegmentRequest
//   scrollViewport: ScrollViewportRequest
//   search: SearchRequest
//   replace: ReplaceRequest
//   undoChange: UndoRequest
//   viewportRefresh: never
// }
export interface ExtensionMessageRequests {
  showMessage: NotificationRequest
  setUITheme: SetUIThemeRequest
}

export interface ExtensionMessageResponses {
  showMessage: undefined
  setUITheme: void
}

export interface DataEditorMessageResponses
  extends Record<keyof DataEditorMessageRequests, unknown> {
  clearChanges: void
  applyChanges: ChangesInfoResponse
  editorOnChange: EditorOnChangeResponse
  fileInfo: FileInfoResponse
  counts: CountResponse
  // heartbeat: IServerHeartbeat & { port: number } // service
  profile: ProfileResponse
  redoChange: void
  replaceResults: ReplaceResponse
  requestEditedData: EditedDataResponse
  save: void
  saveAs: SaveAsResponse
  saveSegment: void
  scrollViewport: void
  search: SearchResponse
  replace: ReplaceResponse
  undoChange: void
  viewportRefresh: ViewportRefreshResponse
}

export type VSEditorMessagePackage<K extends keyof DataEditorMessageRequests> =
  {
    command: K
    payload: DataEditorMessageRequests[K]
  }

export type VSExtensionMessagePackage<
  K extends keyof ExtensionMessageRequests,
> = {
  command: K
  payload: ExtensionMessageRequests[K]
}

export type VSMessagePackage =
  | VSEditorMessagePackage<keyof DataEditorMessageRequests>
  | VSExtensionMessagePackage<keyof ExtensionMessageRequests>
