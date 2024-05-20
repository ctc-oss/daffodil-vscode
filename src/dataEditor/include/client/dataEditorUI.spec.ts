import { describe, it } from 'mocha'
import { DataEditorUI } from './dataEditorUI'
import { Mediator } from '../mediator/mediator'
import { MediatorEvent } from '../mediator/events'
import assert from 'assert'
class _Mediator implements Mediator {
  notify<K extends keyof MediatorEvent>(
    type: K,
    event: Required<MediatorEvent[K]>
  ): void {
    const handler = this.handles.get(type)
    if (handler) handler(event)
  }
  handles: Map<keyof MediatorEvent, (content: any) => void> = new Map()
  register<K extends keyof MediatorEvent>(
    type: K,
    handler: (content: MediatorEvent[K]) => void
  ): void {
    this.handles.set(type, handler)
  }
}
class ConsoleEditorUI extends DataEditorUI {
  protected uiText = ''
  constructor(mediator: Mediator) {
    super(mediator, 'consoleui')
  }
  protected registerEventHandlers(): void {
    this.mediator.register('dataUpdate', (content) => {
      this.uiText = content.binData.toString()
    })
  }
  display() {
    this.mediator.notify('displaySettingUpdate', { settings: { radix: 16 } })
    return this.uiText
  }
}

const mediator = new _Mediator()
describe('Data Editor UI Behavior', () => {
  const ui = new ConsoleEditorUI(mediator)
  it('Should register an event for receiving data updates', () => {
    const binData = new Uint8Array(8)
    mediator.notify('dataUpdate', { binData })
    assert.equal(ui.display(), binData.toString())
  })
})
