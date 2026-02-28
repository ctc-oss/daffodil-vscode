import {
  DataEditorMessageRequests,
  DataEditorMessageResponses,
  VSMessagePackage,
} from 'ext_types'
import { isEditorMessageId, isExtensionMessageId } from 'ext_types/messageIds'
import { handleExtensionMessage } from './extensionMsgHandler'

export type EditorMessageHandler = <K extends keyof DataEditorMessageRequests>(
  type: K,
  message: DataEditorMessageRequests[K]
) => DataEditorMessageResponses[K]

export async function handleMessage(msg: VSMessagePackage) {
  if (isExtensionMessageId(msg.command)) {
    handleExtensionMessage(msg)
  }
  if (isEditorMessageId(msg.command)) {
  }
  throw `Unknown message command: ${msg.command}`
}
