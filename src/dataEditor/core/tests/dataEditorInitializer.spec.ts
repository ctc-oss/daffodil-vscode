import { describe } from 'mocha'
import assert from 'assert'
import { DataEditorManager } from '../../core/manager'
import { DataEditor } from '../../core/editor/client'
import { EditService, EditServiceProvider } from '../service'
import { DataEditorUI } from '../editor/ui'
import { DataEditorInitializer } from '../editor/initializer'

type Invoker = DataEditorManager['Run']
const ResolvingInitializer: Invoker = (i: DataEditorInitializer) => {
  return new Promise(async (resolve, reject) => {
    assert(await i.Initialize())
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
      const service = await this.provider.getService()
      res(new MockEditor(service, {}))
    })
  }
}

describe('Data Editor Initializer Behavior', () => {
  it("Should contain its associated editor's required components", async () => {
    await ResolvingInitializer(new AsyncInitializer())
  })
})
