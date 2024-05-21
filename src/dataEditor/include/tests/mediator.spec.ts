import { describe, it } from 'mocha'
import assert from 'assert'
import { MockMediator } from './utils/mocks'

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
