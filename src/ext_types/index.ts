import { IServerHeartbeat } from '@omega-edit/client'
import {
  MessageRequestMap,
  MessageResponseMap,
  PostMessageArgs,
} from './messageContent'
import {
  CountResponse,
  SearchResponse,
  ChangesInfoResponse,
  EditorOnChangeResponse,
  FileInfoResponse,
  ProfileResponse,
  ReplaceResponse,
  EditedDataResponse,
  SaveAsResponse,
  ViewportRefreshResponse,
  DFDLDataBytePos,
} from './messages'
import { Disposable } from 'vscode'

export * from './formattypes'
export * from './messageContent'
export * from './messages'

export type EditorMessageListener<K extends keyof MessageResponseMap> = (
  payload: MessageResponseMap[K]
) => void

export type EditorMessageListenerMap = {
  [K in keyof MessageResponseMap]: EditorMessageListener<K>
}
