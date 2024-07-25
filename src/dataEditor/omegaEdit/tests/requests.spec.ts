import { describe } from 'mocha'

class RequestHandler {
  static Handle(request: Request): Promise<any> {
    return new Promise((res, rej) => {
      res({})
    })
  }
}

interface Request {
  type: string
}
interface Requests {
  data: { from: number; to: number }
  info: { filename: string; filesize: number }
}
type ResponseMap = { [R in keyof Requests]: any }
interface Responses extends ResponseMap {}
class RequestCreator {
  static Create<T extends keyof Requests>(
    type: T,
    request: Requests[T]
  ): Request {
    return { type }
  }
}
function send(request: any) {}
describe('Request / Response Behavior', () => {
  describe('RequestCreator', () => {
    const request = RequestCreator.Create('info', { filename: '', filesize: 0 })
  })
  describe('RequestHandler', () => {
    const DataRequest: { type: 'data' } = { type: 'data' }
    // RequestHandler.Handle()
  })
})
