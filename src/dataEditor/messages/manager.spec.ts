import assert from 'assert'
import EventEmitter from 'events'
import { describe } from 'mocha'

interface RequestEvents {
  ping: []
  scroll: [data: { offset: number }]
  multidata: [data: { str: string; bin: Uint8Array; num: number }]
}
interface ResponseEvents {
  pong: []
  'file-info': [data: { filename: string; size: number }]
}
type EventMap = { [K: string]: [any] }
type RequestListener<E> = {
  on<Key extends string & keyof E>(
    event: Key,
    listener: (content: E[Key]) => void
  ): void
}
class RequestEmitter extends EventEmitter {}
class Requester<EventTypes> {
  constructor(
    public __channelNotify: <R extends keyof EventTypes>(
      type: R,
      data: EventTypes[R]
    ) => void
  ) {}
  request<R extends keyof EventTypes>(type: R, data: EventTypes[R]) {}
}
class Responder<EventTypes> {
  constructor(
    public __channelNotify: <R extends keyof EventTypes>(
      type: R,
      data: EventTypes[R]
    ) => void
  ) {}
  respond<R extends keyof EventTypes>(type: R, data: EventTypes[R]) {}
}
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
  __requester: ChannelMember<Req, Res> | undefined
  __requestMap: { [K in keyof Res]: (request: Res[K]) => void }
  __responder: ChannelMember<Res, Req> | undefined
  __responseMap: { [K in keyof Req]: (request: Req[K]) => void }
  constructor() {}
  createRequester() {
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
  createResponder() {
    this.__responder = new ChannelMember<Res, Req>((type, data) => {
      this.__requestMap![type](data)
    })
    return this.__responder
  }
}

// class EventChannelManager {
//   static CreateChannel<Req, Res>(): EventChannel
// }
describe('', () => {
  const ec = new EventChannel<RequestEvents, ResponseEvents>()
  const req = ec.createRequester().send('ping', [])
})
