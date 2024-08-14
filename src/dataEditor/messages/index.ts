import * as msg_types from './dataEditorMessages'

export interface DataEditorMessage {
  clearChanges: undefined
  redoChange: undefined
  undoChange: undefined
  saveAs: undefined
  save: undefined
  applyChanges: msg_types.ApplyChanges
  requestEditedData: msg_types.RequestEditedData
  scrollViewport: msg_types.ScrollViewport
  editorOnChange: msg_types.EditorOnChange
  saveSegment: msg_types.SaveSegment
  profile: msg_types.Profile
  search: msg_types.Search
  replace: msg_types.Replace
}
export interface DataEditorInputMessages {}
export interface DataEditorResponseMessages {}

export class DataEditorMessenger {
  constructor(private sendMessage: MessengerStrategy) {}
  send<T extends keyof DataEditorMessage>(
    type: T,
    ...[content]: DataEditorMessage[T] extends undefined
      ? []
      : [content: DataEditorMessage[T]]
  ) {
    if (!content) this.sendMessage(type, content)
    else this.sendMessage(type)
  }
}

export type MessengerStrategy = (type: string, msg?: object) => any
