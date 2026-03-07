import { type DataEditorMessageKeys, type MessageResponseMap } from 'ext_types'
import {
  EditorMessageIds,
  isEditorMessageId,
  type EditorMessageId,
} from '../../../ext_types/messageIds'

export type IncomingMessage = {
  command: keyof MessageResponseMap
  data: MessageResponseMap[keyof MessageResponseMap]
}

function isEditorMessage(msg: any): msg is IncomingMessage {
  return msg && isEditorMessageId(msg.command)
}

function dispatchEditorEvent(event: MessageEvent) {
  const msg = event.data
  if (!isEditorMessage(msg)) return

  window.dispatchEvent(new CustomEvent(msg.command, { detail: msg.data }))
  //   window.dispatchEvent(new CustomEvent())
}
window.addEventListener('message', dispatchEditorEvent)
