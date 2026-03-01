import {
  type ChangesInfoResponse,
  type CountResponse,
  type EditedDataResponse,
  type EditorOnChangeResponse,
  type FileInfoResponse,
  type MessageRequestMap,
  type MessageResponseMap,
  type ProfileResponse,
  type ReplaceResponse,
  type SaveAsResponse,
  type SearchResponse,
  type ViewportRefreshResponse,
} from 'ext_types'
import type { IServerHeartbeat } from '@omega-edit/client'

export type EditorMessageListener<K extends keyof MessageResponseMap> = (
  payload: MessageResponseMap[K]
) => void

export type EditorMessageListenerMap = {
  [K in keyof MessageResponseMap]: EditorMessageListener<K>
}

export const DefaultEditorListenerMap: EditorMessageListenerMap = {
  clearChanges: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  applyChanges: function (payload: ChangesInfoResponse): void {
    throw new Error('Function not implemented.')
  },
  editorOnChange: function (payload: EditorOnChangeResponse): void {
    throw new Error('Function not implemented.')
  },
  fileInfo: function (payload: FileInfoResponse): void {
    throw new Error('Function not implemented.')
  },
  counts: function (payload: CountResponse): void {
    throw new Error('Function not implemented.')
  },
  profile: function (payload: ProfileResponse): void {
    throw new Error('Function not implemented.')
  },
  redoChange: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  replaceResults: function (payload: ReplaceResponse): void {
    throw new Error('Function not implemented.')
  },
  requestEditedData: function (payload: EditedDataResponse): void {
    throw new Error('Function not implemented.')
  },
  save: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  saveAs: function (payload: SaveAsResponse): void {
    throw new Error('Function not implemented.')
  },
  saveSegment: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  scrollViewport: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  search: function (payload: SearchResponse): void {
    throw new Error('Function not implemented.')
  },
  replace: function (payload: ReplaceResponse): void {
    throw new Error('Function not implemented.')
  },
  undoChange: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  viewportRefresh: function (payload: ViewportRefreshResponse): void {
    throw new Error('Function not implemented.')
  },
  showMessage: function (payload: undefined): void {
    throw new Error('Function not implemented.')
  },
  setUITheme: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  heartbeat: function (payload: IServerHeartbeat & { port: number }): void {
    throw new Error('Function not implemented.')
  },
}
