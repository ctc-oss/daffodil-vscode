import { describe, it } from 'mocha'
import { Mediator } from './mediator'
// import { MediatorEvent } from './events'
import assert from 'assert'
interface MockEvent {}
interface RandomEvent {
  num: number
}
interface StringEvent {
  str: string
}
interface MockEvent {
  randEvent: RandomEvent
}
interface MockEvent {
  strEvent: StringEvent
}
class MockMediator implements Mediator<MockEvent> {
  eventHandlers: Map<keyof MockEvent, (event: any) => void> = new Map()
  notify<K extends keyof MockEvent>(
    type: K,
    event: Required<MockEvent[K]>
  ): void {
    const handle = this.eventHandlers.get(type)
    if (handle) handle(event)
  }
  register<K extends keyof MockEvent>(
    type: K,
    handler: (content: MockEvent[K]) => void
  ): void {
    this.eventHandlers.set(type, handler)
  }
}
describe('Mediator Behavior', () => {
  const mediator = new MockMediator()
  it('Should be require event registration', () => {
    const expected = 'TestStr1234'

    mediator.register('strEvent', (event) => {
      const { str } = event
      assert.equal(str, expected)
    })

    mediator.notify('strEvent', { str: expected })
  })
})
