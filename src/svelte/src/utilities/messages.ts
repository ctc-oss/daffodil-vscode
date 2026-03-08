import { type MessageResponseMap } from 'ext_types'
import { isEditorMessageId } from '../../../ext_types/messageIds'

export type IncomingMessage = {
  command: keyof MessageResponseMap
  id: string
  data: MessageResponseMap[keyof MessageResponseMap]
}

function isEditorMessage(msg: any): msg is IncomingMessage {
  return msg && isEditorMessageId(msg.command)
}

function dispatchEditorEvent(event: MessageEvent) {
  const msg = event.data
  if (!isEditorMessage(msg)) return

  window.dispatchEvent(
    new CustomEvent(msg.command, { detail: { id: msg.id, data: msg.data } })
  )
}
window.addEventListener('message', dispatchEditorEvent)
