import { IServerHeartbeat } from '@omega-edit/client'
import {
  ApplyChangesRequest,
  ChangesInfoResponse,
  CountResponse,
  DFDLDataBytePos,
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
import {
  EditorRequestIds,
  isEditorMessageId,
  type EditorMessageId,
} from './messageIds'

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

type CommandMap = {
  [K in MessageCommands]: any
}
export interface MessageRequestMap extends CommandMap {
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
  undoChange: never
  viewportRefresh: never
  showMessage: NotificationRequest
  setUITheme: SetUIThemeRequest
}

export interface MessageResponseMap extends CommandMap {
  clearChanges: void
  applyChanges: ChangesInfoResponse
  editorOnChange: EditorOnChangeResponse
  fileInfo: FileInfoResponse
  counts: CountResponse
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
  showMessage: void
  setUITheme: void
  heartbeat: IServerHeartbeat & { port: number }
  bytePos1b: DFDLDataBytePos
}

export type ExtensionMessageKeys =
  | 'showMessage'
  | 'setUITheme'
  | 'editorOnChange'

export type DataEditorMessageKeys = Exclude<
  MessageCommands,
  ExtensionMessageKeys
>
export type DataEditorMessageRequests = Pick<
  MessageRequestMap,
  DataEditorMessageKeys
>
export type DataEditorMessageResponses = Pick<
  MessageResponseMap,
  DataEditorMessageKeys
>
/**
 * Key indexable interface to templated type inference of available messages sent between
 * the components of the DFDL VSCode extension.
 */
export type ExtensionMessageRequests = Pick<
  MessageRequestMap,
  ExtensionMessageKeys
>

export interface DFDLSessionMessageResponses extends MessageResponseMap {
  bytesPos1b: DFDLDataBytePos
}

export type VSEditorMessagePackage<K extends keyof DataEditorMessageRequests> =
  {
    command: K
    payload: DataEditorMessageRequests[K]
  }

export type VSExtensionMessagePackage<K extends ExtensionMessageKeys> = {
  command: K
  payload: ExtensionMessageRequests[K]
}

export type VSMessagePackage = {
  uiId: string
  payload: PostMessageArgs<MessageRequestMap, keyof MessageRequestMap>
}

export type VSMessageRequest<K extends keyof MessageRequestMap> = {
  uiId: string
  payload: PostMessageArgs<MessageRequestMap, K>
}
export function getRequestCommandType(cmd: string, payload: any) {
  if (!isEditorMessageId(cmd)) {
    throw ''
  } else {
    const cmdIdx = EditorRequestIds.findIndex((ids) => {
      return ids == cmd
    })
    return EditorRequestIds[cmdIdx]
  }
}
export function getRequestPayloadType<K extends keyof MessageRequestMap>(
  payload: MessageRequestMap[keyof MessageRequestMap]
) {
  return payload as MessageRequestMap[K]
}
export type PostMessageArgs<R, K extends keyof R> = [R[K]] extends [never]
  ? [type: K]
  : [type: K, payload: R[K]]
