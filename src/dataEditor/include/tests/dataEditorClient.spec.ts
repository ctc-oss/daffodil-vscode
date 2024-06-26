import { describe, it } from 'mocha'
import { Mediator } from '../mediator/mediator'
import { MappedMediator, MockEvent } from './utils/mocks'
import assert from 'assert'

interface EditorInstance {
  registerMediator<EventCategory>(
    category: string,
    mediator: Mediator<EventCategory>
  ): void
}
interface DisplayConfigEvent {}
type SetDisplayRadix = 2 | 8 | 10 | 16
interface DisplayConfigEvent {
  setRadix: SetDisplayRadix
}
type SetDisplayEncoding = 'ascii' | 'utf-8'
interface DisplayConfigEvent {
  setEncoding: SetDisplayEncoding
}
const DisplayConfigMediator = new MappedMediator<DisplayConfigEvent>()
const MockEventMediator = new MappedMediator<MockEvent>()

class MockEditor implements EditorInstance {
  mediators: Map<string, Mediator<any>> = new Map()
  registerMediator<EventCategory>(
    category: string,
    mediator: Mediator<EventCategory>
  ): void {
    this.mediators.set(category, mediator)
  }
}
describe('Data Editor Abstraction Behavior', () => {
  const editor = new MockEditor()
  editor.registerMediator('display', DisplayConfigMediator)
  editor.registerMediator('mock', MockEventMediator)
  /* 
    What should a 'Data Editor' do?
      - Act as a container of all components related to editing data
      - Route event signals and responses between its components
          - Components may contain events that might not need to be propegated to the editing service.
            (e.g. DisplayConfigComponent handles/send DisplayCOnfigEvent)

          Data Editor Components?
            - Edit Service Component
            - Display Config Component
            - Debug Session Component (debug only)

            So should components come with mediators that are registered? See mediator.spec.ts
  */
  it('Should support handling different categories of events', () => {
    assert.equal(editor.mediators.size, 2)
  })
})
