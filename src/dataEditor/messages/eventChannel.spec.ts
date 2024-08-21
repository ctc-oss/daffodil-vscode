import assert from 'assert'
import { describe } from 'mocha'
import { EventEmitter } from 'stream'

interface RequestMap {
  ping: void
  simple: { num: number }
}
interface ResponseMap {
  pong: void
  fileInfo: { filename: string; size: number }
}
interface EventChannelMember<OutgoingEventMap, IncomingEventMap> {
  onReceived<K extends keyof IncomingEventMap & string>(
    event: K,
    listener: (arg: IncomingEventMap[K]) => void
  ): void
  send<K extends keyof OutgoingEventMap & string>(
    event: K,
    data: OutgoingEventMap[K]
  ): void
}
// class Requester implements EventChannelMember<RequestMap, ResponseMap> {
//   readonly __emitter = new EventEmitter()
//   send<K extends keyof RequestMap>(event: K, data: RequestMap[K]): void {
//     this.__emitter.emit(event, data)
//   }
//   onReceived<K extends keyof ResponseMap & string>(
//     event: K,
//     listener: (data: ResponseMap[K]) => void
//   ) {
//     this.__emitter.on(event, listener)
//   }
// }
// class Responder implements EventChannelMember<ResponseMap, RequestMap> {
//   readonly __emitter = new EventEmitter()
//   onReceived<K extends 'ping' | 'simple'>(
//     event: K,
//     listener: (arg: RequestMap[K]) => void
//   ): void {
//     throw new Error('Method not implemented.')
//   }
//   send<K extends 'pong' | 'fileInfo'>(event: K, data: ResponseMap[K]): void {
//     throw new Error('Method not implemented.')
//   }
// }
/// Holds an event emitter that emits both Request and Response Events
class EventChannel<RequestTypeMap, ResponseTypeMap> {
  readonly __emitter = new EventEmitter()
  __req: EventChannelMember<RequestTypeMap, ResponseTypeMap> | undefined =
    undefined
  __res: EventChannelMember<ResponseTypeMap, RequestTypeMap> | undefined =
    undefined
  // constructor(readonly id: string){}
  constructor() {}
  GetRequester() {
    this.__req = {
      onReceived: this.__emitter.on,
      send: this.__emitter.emit,
    }
    return this.__req
  }
  GetResponder() {
    this.__res = {
      onReceived: this.__emitter.on,
      send: this.__emitter.emit,
    }
    return this.__res
  }
}
namespace DataEditorChannels {
  export interface AvailableChannelTypes {
    default: { request: RequestMap; response: ResponseMap }
  }
  type RequestType<Channel extends keyof AvailableChannelTypes> =
    AvailableChannelTypes[Channel]['request']
  type ResponseType<Channel extends keyof AvailableChannelTypes> =
    AvailableChannelTypes[Channel]['response']

  type EventChannelList = {
    [Type in keyof AvailableChannelTypes]: {
      id: string
      channel: EventChannel<RequestType<Type>, ResponseType<Type>>
    }[]
  }
  export const Channels: EventChannelList = {
    default: [],
  }

  export function Create<Type extends keyof AvailableChannelTypes>(
    type: Type,
    id: string
  ): EventChannel<RequestType<Type>, ResponseType<Type>> {
    const channel = new EventChannel<RequestType<Type>, ResponseType<Type>>()
    Channels[type].push({ channel, id })
    return channel
  }
  export function Get<Type extends keyof AvailableChannelTypes>(
    type: Type,
    id: string
  ) {
    const channel = Channels[type].find((channel) => {
      return channel.id == id
    })
    if (!channel) throw `No Channel exists with ID: ${id}`
    return channel
  }
}
describe('EventChannel Behavior', () => {
  const TestChannelId = 'test-id'
  it('Should be managed from a static manager instance', () => {
    DataEditorChannels.Create('default', TestChannelId)
    assert(
      DataEditorChannels.Channels.default.length == 1,
      'Default channel was not created'
    )
    assert(
      DataEditorChannels.Channels.default[0].id == TestChannelId,
      'Channel ID incorrect'
    )
  })
  it('Should throw if attempting to get a channel that does not exist', () => {
    assert.throws(() => {
      try {
        DataEditorChannels.Get('default', '')
      } catch (e) {
        throw e
      }
    })
  })
  it('Should provide templated types for the respective channel member getter', () => {
    const channel = new EventChannel<RequestMap, ResponseMap>()
    const req = channel.GetRequester()
    assert(req)
    channel.GetRequester().onReceived('fileInfo', (info) => {
      assert(info.filename)
    })
  })
})
