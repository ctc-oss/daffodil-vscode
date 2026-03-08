import {
  EditorMessageListenerMap,
  MessageRequestMap,
  type EditorMessageListener,
  type MessageResponseMap,
} from 'ext_types'

interface DataEditorDOM {
  register(id: string): void
  addListener<K extends keyof MessageResponseMap>(
    id: string,
    type: K,
    listener: (payload: MessageResponseMap[K]) => void
  ): any
}
type DataEditorCustomEventType = {
  type: keyof MessageResponseMap
  payload: MessageResponseMap[keyof MessageResponseMap]
}
type CustomEventKeys = {
  id: string
  type: keyof MessageResponseMap
}
type DataEditorEventMessageType<K extends keyof MessageResponseMap> =
  MessageResponseMap[K] extends object
    ? CustomEvent<MessageResponseMap[K]>
    : CustomEvent<void>

type DataEditorWindowEventMap = {
  [K in keyof MessageResponseMap]: {
    type: K
    detail: { id: string; data: CustomEvent<MessageResponseMap[K]>['detail'] }
  }
}
declare global {
  interface WindowEventMap extends DataEditorWindowEventMap {}
  interface Window {
    removeListenersFor: (id: string) => void
    addEditorMsgListener: <K extends keyof MessageResponseMap>(
      type: K,
      listener: EditorMessageListener<K>
    ) => void
  }
}

export {}
