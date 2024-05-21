import { describe, it } from 'mocha'
import { DataEditorUI } from '../client/dataEditorUI'
import { MockEditorMediator } from './utils/mocks'
import assert from 'assert'
class ConsoleEditorUI extends DataEditorUI {
  protected inputHandler: (event: 'SAVE') => any = (event) => {
    this.mediator.notify('save', { filePath: MockFilePath })
  }
  uiText = ''
  localdata: Uint8Array = new Uint8Array()
  constructor() {
    super(MockEditorMediator, 'consoleui')
  }
  protected registerEventHandlers(): void {
    this.mediator.register('viewportRefresh', (content) => {
      this.uiText = content.viewportData.toString()
    })
  }
  sendInput(event: 'SAVE') {
    this.inputHandler(event)
  }
  getMediator() {
    return this.mediator
  }
}
const MockFilePath = '/some/random/filepath/to/data.bin'
const MockFile = {
  path: '',
}

function AddMediatorSaveHandler(ui: ConsoleEditorUI) {
  ui.getMediator().register('save', (content) => {
    MockFile.path = content.filePath
  })
}
describe('Data Editor UI Implementation Behavior', () => {
  const ui = new ConsoleEditorUI()
  AddMediatorSaveHandler(ui)

  it('Should contain an event handler for displaying editor data', () => {
    const data = Uint8Array.from([0xff, 0x00, 0xbe, 0xef])
    ui.getMediator().notify('viewportRefresh', {
      viewportData: data,
      fileOffset: 0,
      length: 4,
      bytesLeft: 0,
    })
    assert.equal(ui.uiText, data.toString())
  })

  it('Should handle inputs accordingly', () => {
    ui.sendInput('SAVE')
    assert.equal(MockFile.path, MockFilePath)
  })
})
