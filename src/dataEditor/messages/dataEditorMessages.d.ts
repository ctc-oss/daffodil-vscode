import type { DisplayRadix, EditByteModes } from 'dataEditor/include/types'

export type ApplyChanges = {
  offset: number
  originalSegment: Uint8Array | never[]
  editedSegment: Uint8Array
}
export type RequestEditedData = {
  viewportId: string
  startOffset: number
  selectionSize: number
  editedContentStr: string
  radix: DisplayRadix
  editMode: EditByteModes
}

export type ScrollViewport = {
  scrollToOffset: number
  bytesPerRow: number
  numLinesDisplayed: number
}
export type EditorOnChange = {
  fileOffset: number
  selectionData: Uint8Array
  encoding: string
  selectionSize: number
  editMode: EditByteModes
}
export type SaveSegment = {
  startOffset: number
  length: number
}
export type Profile = {
  startOffset: number
  length: number
}
export interface Search {
  searchDataStr: string
  caseInsensitive: boolean
  isReverse: boolean
  encoding: string
  searchStartOffset: number
  searchLength: number
  limit: number
}
export interface Replace extends Search {
  replaceDataStr: string
  overwriteOnly: boolean
}
export interface BaseDataEditorRequests {
  ping: { fromId: string }
  clearChanges: undefined
  redoChange: undefined
  undoChange: undefined
  saveAs: undefined
  save: undefined
  applyChanges: ApplyChanges
  requestEditedData: RequestEditedData
  scrollViewport: ScrollViewport
  editorOnChange: EditorOnChange
  saveSegment: SaveSegment
  profile: Profile
  search: Search
  replace: Replace
}
export interface BaseDataEditorResponses {
  pong: { fromId: string }
}
/** 
### Data Editor Event Channel Types
#### Extending a custom channel type

*/
export interface AvailableChannelTypes {
  default: {
    request: BaseDataEditorRequests
    response: BaseDataEditorResponses
  }
}

export type ChannelRequestType<Channel extends keyof AvailableChannelTypes> =
  AvailableChannelTypes[Channel]['request']

export type ChannelResponseType<Channel extends keyof AvailableChannelTypes> =
  AvailableChannelTypes[Channel]['response']

export interface EventChannelMember<OutgoingEventMap, IncomingEventMap> {
  on<K extends keyof IncomingEventMap & string>(
    event: K,
    listener: (arg: IncomingEventMap[K]) => void
  ): void
  send<K extends keyof OutgoingEventMap & string>(
    event: K,
    data: OutgoingEventMap[K]
  ): void
}
