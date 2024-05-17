import { describe, it } from 'mocha'
import {
  IMediator,
  IMediatorComponent,
  MediatorEvent,
  MediatorEventListener,
} from './editorMediator'
import assert from 'assert'

enum EditorEventTypes {
  apply,
  search,
  insert,
  save,
  dataUpdate,
}
// interface EditorEvent {}

class DataUpdateEvent implements MediatorEvent<EditorEventTypes> {
  readonly type = EditorEventTypes.dataUpdate
  constructor(readonly data: Uint8Array) {}
  content() {
    return this.data
  }
}

class Editor implements IMediator<EditorEventTypes> {
  handlers: Map<EditorEventTypes, MediatorEventListener<any>[]> = new Map()
  notify(event: MediatorEvent<EditorEventTypes>): void {
    const handlers = this.handlers.get(event.type)
    if (handlers)
      handlers.forEach((handler) => {
        handler(event)
      })
  }
  register<D>(
    type: EditorEventTypes,
    handlers: MediatorEventListener<D>[]
  ): void {
    const existingHandler = this.handlers.get(type)
    if (existingHandler) existingHandler.push(...handlers)
    else this.handlers.set(type, handlers)
  }
}

class EditorUI extends IMediatorComponent<EditorEventTypes> {
  dataText: string = ''
  constructor(editor: Editor) {
    super(editor)
  }
  protected registerEventHandlers(): void {
    this.mediator.register(EditorEventTypes.dataUpdate, [
      (content: DataUpdateEvent) => {
        content.toString()
        content.data.forEach((byte) => {
          this.dataText += ' 0x' + byte.toString(16)
        })
      },
    ])
  }
}

// class EditorLog extends IMediatorComponent<EditorEventTypes> {
//   constructor(editor: Editor) {
//     super(editor)
//   }
//   protected registerEventHandlers(): void {}
// }
describe('Editor Mediator Behavior', () => {
  const editor = new Editor()

  it('Shoud handle properly', () => {
    const ui = new EditorUI(editor)
    const size = editor.handlers.size
    const expected = 1
    assert.equal(size, expected)
    editor.notify(
      new DataUpdateEvent(
        Uint8Array.from([0x00, 0x01, 0xff, 0xde, 0xad, 0xbe, 0xef])
      )
    )
    assert(ui.dataText != '')
  })
  it('Should provide functionality for components to register a single event to multiple Events', () => {})
})
