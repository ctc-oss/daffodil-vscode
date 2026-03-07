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

export const DefaultEditorListenerMap: EditorMessageListenerMap = {
  clearChanges: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  applyChanges: function (payload: ChangesInfoResponse): void {
    throw new Error('Function not implemented.')
  },
  editorOnChange: function (payload: EditorOnChangeResponse): void {
    throw new Error('Function not implemented.')
  },
  fileInfo: function (payload: FileInfoResponse): void {
    throw new Error('Function not implemented.')
  },
  counts: function (payload: CountResponse): void {
    throw new Error('Function not implemented.')
  },
  profile: function (payload: ProfileResponse): void {
    throw new Error('Function not implemented.')
  },
  redoChange: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  replaceResults: function (payload: ReplaceResponse): void {
    throw new Error('Function not implemented.')
  },
  requestEditedData: function (payload: EditedDataResponse): void {
    throw new Error('Function not implemented.')
  },
  save: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  saveAs: function (payload: SaveAsResponse): void {
    throw new Error('Function not implemented.')
  },
  saveSegment: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  scrollViewport: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  search: function (payload: SearchResponse): void {
    throw new Error('Function not implemented.')
  },
  replace: function (payload: ReplaceResponse): void {
    throw new Error('Function not implemented.')
  },
  undoChange: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  viewportRefresh: function (payload: ViewportRefreshResponse): void {
    throw new Error('Function not implemented.')
  },
  showMessage: function (payload: undefined): void {
    throw new Error('Function not implemented.')
  },
  setUITheme: function (payload: void): void {
    throw new Error('Function not implemented.')
  },
  heartbeat: function (payload: IServerHeartbeat & { port: number }): void {
    throw new Error('Function not implemented.')
  },
  bytesPos1b: function (payload: DFDLDataBytePos): void {
    throw new Error('Function not implemented.')
  },
}

export interface HTMLMessengerInterface extends Disposable {
  addListener<K extends keyof MessageResponseMap>(
    type: K,
    listener: EditorMessageListener<K>
  ): void
  postMessage<K extends keyof MessageRequestMap>(
    ...args: PostMessageArgs<MessageRequestMap, K>
  ): void
  onDispose(listener: () => void): void
}

const EditorHTMLMessengerRegistry = new Map<string, EditorMessageListenerMap>()

export function registerHTMLMessenger(
  id: string,
  disposalHook?: (disposeFn: () => void) => void
) {
  let registrySlot = EditorHTMLMessengerRegistry.get(id)
  if (registrySlot) {
    console.error(`An HTML messenger of id ${id} is already registered`)
    return () => {
      registrySlot
    }
  } else EditorHTMLMessengerRegistry.set(id, DefaultEditorListenerMap)

  return {
    listeners: EditorHTMLMessengerRegistry.get(id),
    onDispose: (callback: () => void) => {
      callback()
      EditorHTMLMessengerRegistry.delete(id)
    },
  }
}

export function unregisterHTMLMessenger(id: string) {
  if (EditorHTMLMessengerRegistry.get(id))
    EditorHTMLMessengerRegistry.delete(id)
}

export function getHTMLMessenger(id: string) {
  if (!EditorHTMLMessengerRegistry.get(id)) {
    throw `No HTML messenger of id ${id} is registered`
  }
  return {
    addDisposalHook: (hook: () => void) => {},
  }
}
