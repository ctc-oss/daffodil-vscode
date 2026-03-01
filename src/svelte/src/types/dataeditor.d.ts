import { type MessageResponseMap } from 'ext_types'

interface DataEditorDOM {
  register(id: string): void
  addListener<K extends keyof MessageResponseMap>(
    id: string,
    type: K,
    listener: (payload: MessageResponseMap[K]) => void
  ): any
}

declare global {
  interface Window {
    addEditorMessageListener<K extends keyof MessageResponseMap>(
      id: string,
      type: K,
      listener: (payload: MessageResponseMap[K]) => void
    ): any
  }
}

export {}
