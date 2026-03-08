import {
  ApplyChangesData,
  DataEditorMessageRequests,
  DataEditorMessageResponses,
  EditedDataRequest,
  EditorOnChangeRequest,
  MessageRequestMap,
  NotificationRequest,
  ProfileRequest,
  ReplaceRequest,
  SaveRequest,
  SaveSegmentRequest,
  ScrollViewportRequest,
  SearchRequest,
  SetUIThemeRequest,
  VSMessagePackage,
} from 'ext_types'
import { isEditorMessageId } from 'ext_types/messageIds'
import { handleExtensionMessage } from './extensionMsgHandler'

export type EditorMessageHandler = <K extends keyof DataEditorMessageRequests>(
  type: K,
  message: DataEditorMessageRequests[K]
) => DataEditorMessageResponses[K]
export type MessageHandlerType = {
  [K in keyof MessageRequestMap]: (msg: MessageRequestMap[K]) => void
}
export class MessageHandler<K extends keyof MessageRequestMap> {}
