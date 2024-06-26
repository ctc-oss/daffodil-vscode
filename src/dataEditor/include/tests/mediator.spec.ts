import { describe, it } from 'mocha'
import assert from 'assert'
import { MockEvent, MockMediator } from './utils/mocks'
interface Mediator<EventType> {
  registerComponent(id: string, component: MediatorComponent<EventType>): void
}
abstract class MediatorComponent<EventType> {
  constructor(id: string, mediator: Mediator<EventType>) {
    mediator.registerComponent(id, this)
  }
}
class ComponentWithMediator extends MediatorComponent<MockEvent> {
  protected registerEventHandlers(): void {}
  constructor(mediator: Mediator<MockEvent>) {
    super('mock-events', mediator)
  }
}

describe('Mediator Behavior', () => {
  const mediator = MockMediator
  it('Should be require event registration', () => {
    const expected = 'TestStr1234'

    mediator.register('strEvent', (event) => {
      const { str } = event
      assert.equal(str, expected)
    })

    mediator.notify('strEvent', { str: expected })
  })
})
