import assert from 'assert'
import { describe } from 'mocha'

interface RequestEvents {
  ping: {}
  scroll: { offset: number }
  multidata: { str: string; bin: Uint8Array; num: number }
}
interface ResponseEvents {
  pong: {}
  'file-info': { filename: string; size: number }
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
  __requestMap: { [K in keyof Res]: (request: Res[K]) => void } | undefined
  __responder: ChannelMember<Res, Req> | undefined
  __responseMap: { [K in keyof Req]: (request: Req[K]) => void } | undefined
  constructor() {}
  __setRequestMap(map: { [K in keyof Res]: (request: Res[K]) => void }) {
    this.__requestMap = map
  }
  __setResponseMap(map: { [K in keyof Req]: (request: Req[K]) => void }) {
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

describe('', () => {
  const ec = new EventChannel<RequestEvents, ResponseEvents>()
  const req = ec.createRequester({
    pong: () => {
      console.log('Req got pong!')
    },
    'file-info': function (request: { filename: string; size: number }): void {
      throw new Error('Function not implemented.')
    },
  })
  const res = ec.createResponder({
    ping: function (request: {}): void {
      console.log('Responder got ping!')
      assert(true)
    },
    scroll: function (request: { offset: number }): void {
      console.log('Responder got scroll!')
      assert(true)
      res.send('pong', {})
    },
    multidata: function (request: {
      str: string
      bin: Uint8Array
      num: number
    }): void {
      throw new Error('Function not implemented.')
    },
  })
  assert(req)
  assert(res)

  req.send('ping', {})
  req.send('scroll', { offset: 0x420 })
})
