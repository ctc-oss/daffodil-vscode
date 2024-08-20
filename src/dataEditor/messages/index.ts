import type * as msg_types from './dataEditorMessages.d.ts'

export interface DataEditorRequests {
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
export interface DataEditorResponses {}

class ChannelMember<OutEvents, InEvents> {
  constructor(
    readonly send: <R extends keyof OutEvents>(
      type: R,
      data: OutEvents[R]
    ) => void,
    readonly on: <R extends keyof InEvents>(
      type: R,
      listener: (data: InEvents[R]) => void
    ) => void
  ) {}
}
class EventChannel<Req, Res> {
  private __requester: ChannelMember<Req, Res> | undefined
  private __requestMap:
    | { [K in keyof Res]: (request: Res[K]) => void }
    | undefined
  private __responder: ChannelMember<Res, Req> | undefined
  private __responseMap:
    | { [K in keyof Req]: (request: Req[K]) => void }
    | undefined
  constructor() {}
  private __setRequestMap(map: {
    [K in keyof Res]: (request: Res[K]) => void
  }) {
    this.__requestMap = map
  }
  private __setResponseMap(map: {
    [K in keyof Req]: (request: Req[K]) => void
  }) {
    this.__responseMap = map
  }
  createRequester(map: { [K in keyof Res]: (request: Res[K]) => void }) {
    this.__setRequestMap(map)
    this.__requester = new ChannelMember<Req, Res>(
      (type, data) => {
        this.__responseMap![type](data)
      },
      (type, listener) => {
        this.__requestMap![type] = listener
      }
    )
    return this.__requester
  }
  createResponder(map: { [K in keyof Req]: (request: Req[K]) => void }) {
    this.__setResponseMap(map)
    this.__responder = new ChannelMember<Res, Req>(
      (type, data) => {
        this.__requestMap![type](data)
      },
      (type, listener) => {
        this.__responseMap![type] = listener
      }
    )
    return this.__responder
  }
}

export function CreateDataEditorChannel<
  RequestEvents extends DataEditorRequests,
  ResponseEvents extends DataEditorResponses,
>(sessionId: string) {
  return new EventChannel<RequestEvents, ResponseEvents>()
}

export interface EventChannelTypes {
  default: { request: DataEditorRequests; response: DataEditorResponses }
}
export interface DebuggerResponses extends DataEditorResponses {
  bytesPos1b: { pos: number }
}

export interface EventChannelTypes {
  debugger: { request: DataEditorRequests; response: DebuggerResponses }
}

type EventChannelList = {
  [Type in keyof EventChannelTypes]: {
    id: string
    channel: EventChannelTypes[Type]
  }[]
}

const EventChannels: EventChannelList = {
  default: [],
  debugger: [],
}
type RequestType<Channel extends keyof EventChannelTypes> =
  EventChannelTypes[Channel]['request']
type ResponseType<Channel extends keyof EventChannelTypes> =
  EventChannelTypes[Channel]['response']
export function CreateEventChannel<ChannelType extends keyof EventChannelTypes>(
  c: ChannelType,
  id: string,
  requestMap?: RequestType<ChannelType>,
  responseMap?: ResponseType<ChannelType>
): EventChannel<RequestType<ChannelType>, ResponseType<ChannelType>> {
  const channel = new EventChannel<
    RequestType<ChannelType>,
    ResponseType<ChannelType>
  >()
  return channel
}
export function GetEventChannel<ChannelType extends keyof EventChannelTypes>(
  type: ChannelType,
  id: string
) {
  const channel = EventChannels[type].find((channel) => {
    return channel.id === id
  })
  if (!channel) throw `Channel <"${id}"> not found`
  return channel
}
