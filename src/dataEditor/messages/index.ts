import EventEmitter from 'events'
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

/// Holds an event emitter that emits both Request and Response Events
class EventChannel<RequestTypeMap, ResponseTypeMap> {
  readonly __emitter = new EventEmitter()
  private __req: EventChannelMember<RequestTypeMap, ResponseTypeMap> = {
    on: this.__emitter.on,
    send: this.__emitter.emit,
  }
  private __res: EventChannelMember<ResponseTypeMap, RequestTypeMap> = {
    on: this.__emitter.on,
    send: this.__emitter.emit,
  }
  constructor() {}
  GetRequester() {
    return this.__req
  }
  GetResponder() {
    return this.__res
  }
}

type EventChannelList = {
  [Type in keyof AvailableChannelTypes]: {
    id: string
    channel: EventChannel<ChannelRequestType<Type>, ChannelResponseType<Type>>
  }[]
}
const ActiveChannels: EventChannelList = {
  default: [],
}
export const ChannelEvent = new EventEmitter()
export function CreateEventChannel<Type extends keyof AvailableChannelTypes>(
  type: Type,
  id: string
): EventChannel<ChannelRequestType<Type>, ChannelResponseType<Type>> {
  const channel = new EventChannel<
    ChannelRequestType<Type>,
    ChannelResponseType<Type>
  >()
  ActiveChannels[type].push({ channel, id })
  ChannelEvent.emit('added', { channel, id })
  return channel
}
export function GetEventChannel<Type extends keyof AvailableChannelTypes>(
  type: Type,
  id: string
): EventChannel<ChannelRequestType<Type>, ChannelResponseType<Type>> {
  const member = ActiveChannels[type].find((channel) => {
    return channel.id == id
  })
  if (!member) throw `No Channel exists with ID: ${id}`
  return member.channel
}
