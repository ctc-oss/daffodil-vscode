import { MessageResponseMap } from './messageContent'

export * from './formattypes'
export * from './messageContent'
export * from './messages'

export type EditorMessageListener<K extends keyof MessageResponseMap> = (
  payload: MessageResponseMap[K]
) => void

export type EditorMessageListenerMap = {
  [K in keyof MessageResponseMap]: EditorMessageListener<K>
}
