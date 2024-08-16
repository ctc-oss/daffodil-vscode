import assert from 'assert'
import { describe } from 'mocha'
import { EventEmitter } from 'stream'

interface RequestEmitter<RequestTypes> {
  on<R extends keyof RequestTypes>(
    event: R,
    listener: (...args: ) => any
  ): any
}
interface ResponseEmitter<ResponseTypes> {
  on(event: string, listener: (...args: any[]) => any): any
}

/// The extension handles all data anyways so it should define both request and response types, or the requester could send any arbitrary request event
class EventChannel<RequestTypes, ResponseTypes> {
  __req: RequestEmitter<RequestTypes> | undefined = undefined
  __res: ResponseEmitter<ResponseTypes> | undefined = undefined
  constructor() {}
  setRequester(req: RequestEmitter<RequestTypes>) {
    if (this.__req) throw 'A Requester already exists on this channel'
    this.__req = req
  }
  setResponder(res: ResponseEmitter<ResponseTypes>) {
    if (this.__res) throw 'A Responder already exists on this channel'
    this.__res = res
  }

}

const EventChannelMap: Map<string, EventChannel<any, any>> = new Map()
class EventManager {
  static CreateChannel<Req, Res>(id: string): EventChannel<Req, Res> {
    const channel = new EventChannel<Req, Res>()
    EventChannelMap.set(id, channel)
    return channel
  }
  static GetChannel<ID extends string>(id: string): EventChannel<EventChannelMap[ID],Res> {
    if (!EventChannelMap.get(id)) throw `No Channel with ID = ${id}` 
    return EventChannelMap.get(id)!
  }
}

interface UIEvents {
  e1: []
  save: [data: { filename: string }]
  shutdown: [data: { filename: string; time: number }]
}
class UIEventEmitter implements RequestEmitter<UIEvents> {
  constructor(private __emitter: EventEmitter<UIEvents>) {}
  // __emitter = new EventEmitter<UIEvents>()
  on = this.__emitter.on
}
class UI {
  readonly __docID = 'session-id'
  __emitter = new EventEmitter<UIEvents>()
  requester: RequestEmitter<UIEvents> = new UIEventEmitter(this.__emitter)
  constructor() {
    EventManager.GetChannel(this.__docID).__req = this.requester
  }
  simulateResponseListenerAdd() {}
  simulateInputReceived() {
    this.__emitter.emit('shutdown', { filename: 'testfile/name.bin', time: 0 })
  }
}
interface ExtResponses {
  'data-refresh': [data: { encoding: string; offset: number; data: Uint8Array }]
  'file-info': [data: { filename: string; filesize: number }]
}
class ExtResponder implements ResponseEmitter<ExtResponses> {
  __emitter = new EventEmitter<ExtResponses>()
  on = this.__emitter.on
}
class Ext {
  readonly __sessionId = 'session-id'
  responder: ResponseEmitter<ExtResponses> = new ExtResponder()
  constructor() {
    const channel = EventManager.CreateChannel<UIEvents, ExtResponses>(this.__sessionId)
  }
}
const ui = new UI()
describe('Event Channel Behavior', () => {
  describe('Manager', () => {
    it('Should create a channel if one does not already exist', () => {
      const channel = EventManager.GetChannel(ui.__docID)
      assert.equal(EventChannelMap.size, 1)
      assert(EventChannelMap.get(ui.__docID))
      assert(channel)
      EventChannelMap.clear()
    })
  })
  it('Should allow a requester to add listeners to events that the responder emits', () => {})
  it('Should allow a responder to add listeners to events that the requester emits', () => {})
  it('Should contain requester and responder abstractions', () => {})
})
