import {
  getHTMLMessenger,
  type ChangesInfoResponse,
  type CountResponse,
  type EditedDataResponse,
  type EditorMessageListener,
  type EditorOnChangeResponse,
  type FileInfoResponse,
  type MessageRequestMap,
  type MessageResponseMap,
  type PostMessageArgs,
  type ProfileResponse,
  type ReplaceResponse,
  type SaveAsResponse,
  type SearchResponse,
  type ViewportRefreshResponse,
} from 'ext_types'
import type { IServerHeartbeat } from '@omega-edit/client'
import { isEditorMessageId } from '../../../ext_types/messageIds'

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

  window.dispatchEvent(
    new CustomEvent(msg.command, { detail: { ...msg.data } })
  )
}

window.addEventListener('message', dispatchEditorEvent)
