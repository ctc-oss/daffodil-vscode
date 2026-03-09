import { type MessageResponseMap } from 'ext_types'
import {
  isEditorMessageId,
  isEditorResponseId,
} from '../../../ext_types/messageIds'

export type IncomingMessage = {
  command: keyof MessageResponseMap
  id: string
  data: MessageResponseMap[keyof MessageResponseMap]
}

function isEditorMessage(msg: any): msg is IncomingMessage {
  return msg && isEditorMessageId(msg.command)
}
function isEditorResponse(msg: any): msg is IncomingMessage {
  return msg && isEditorResponseId(msg.command)
}
function dispatchEditorEvent(event: MessageEvent) {
  const msg = event.data
  if (!isEditorResponse(msg)) return

  window.dispatchEvent(
    new CustomEvent(msg.command, { detail: { id: msg.id, data: msg.data } })
  )
}
window.addEventListener('message', dispatchEditorEvent)
