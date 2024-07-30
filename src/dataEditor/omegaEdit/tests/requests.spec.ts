import assert from 'chai'
import { describe } from 'mocha'

interface Command {
  execute(): any
}
class Service {}
class Session {
  processResponse() {}
  handle: (c: Command) => any = (c) => {}
  sendCommand(c: Command) {
    this.handle(c)
  }
}
interface ResponseReceiver {
  process(response: any): any
}

class GetFileInfo implements Command {
  constructor(public receiver: ResponseReceiver) {}
  execute() {
    this.receiver.process({ name: '/tmp/test', size: 123456 })
  }
}

function getInfo() {
  return {
    file: '/tmp/test',
    size: 12345,
  }
}

describe('Request Command Behavior', () => {
  const service = new Service()
  const session = new Session()
  const ui: ResponseReceiver = {
    process: (response: any) => {
      console.log(response)
    },
  }

  describe('Commands', () => {
    it('Should allow for receivers to injected', () => {
      session.sendCommand(new GetFileInfo(ui))
    })
  })
  describe('Handlers', () => {
    interface CommandMap {
      fileInfo: GetFileInfo
    }
    class TemplatedInvoker {
      send<T extends keyof CommandMap>(type: T, command: CommandMap[T]) {
        command.execute()
      }
    }
    const invoker = new TemplatedInvoker()
    it('Should only allow commands that it can process', () => {
      invoker.send('fileInfo', new GetFileInfo(ui))
    })
  })
})
