import { describe } from 'mocha'
import assert from 'assert'
import { DataEditorManager } from '../../core/manager'
import { DataEditor } from '../../core/editor/client'
import { EditService, EditServiceProvider } from '../../core/service'
import { DataEditorUI } from '../../core/editor/ui'
import { DataEditorInitializer } from '../client/initializer'

type Invoker = DataEditorManager['Run']
const ResolvingInitializer: Invoker = (i) => {
  return new Promise((resolve, reject) => {
    i.Initialize()
    resolve()
  })
}
class MockEditor extends DataEditor {
  constructor(
    protected editService: EditService,
    protected ui: DataEditorUI
  ) {
    super()
  }
}
class AsyncInitializer extends DataEditorInitializer<MockEditor> {
  provider: EditServiceProvider = {
    getService: () => {
      return new Promise((res) => {
        res({})
      })
    },
  }
  Initialize(): Promise<MockEditor> {
    return new Promise(async (res) => {
      res(new MockEditor(await this.provider, {}))
    })
  }
}

describe('Data Editor Initializer Behavior', () => {
  it("Should contain its associated editor's required components", async () => {
    const editor = await ResolvingInitializer(new AsyncInitializer())
    assert(editor)
  })
})
