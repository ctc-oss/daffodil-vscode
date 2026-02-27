import { EditByteModes } from 'ext_types'
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

export enum MessageCommand {
  clearChanges,
  applyChanges,
  editorOnChange,
  fileInfo,
  heartbeat,
  profile,
  redoChange,
  replaceResults,
  requestEditedData,
  save,
  saveAs,
  saveSegment,
  scrollViewport,
  search,
  replace,
  searchResults,
  setUITheme,
  showMessage,
  undoChange,
  updateLogicalDisplay,
  viewportRefresh,
}
export type ExtensionMessageCommands =
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
  | 'searchResults'
  | 'setUITheme'
  | 'showMessage'
  | 'undoChange'
  | 'updateLogicalDisplay'
  | 'viewportRefresh'

/**
 * Key indexable interface to templated type inference of available messages sent between
 * the components of the DFDL VSCode extension.
 */
export interface DataEditorMessageRequests {
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
}
export interface ExtensionMessageRequests {
  showMessage: NotificationRequest
  setUITheme: SetUIThemeRequest
}

export interface ExtensionMessageResponses {
  showMessage: undefined
  setUITheme: void
}

export interface DataEditorMessageResponses {
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
