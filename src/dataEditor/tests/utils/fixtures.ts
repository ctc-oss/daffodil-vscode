import { DataEditor, DataEditorInitializer } from '../../core/editor/dataEditor'
import { DataEditorUI } from '../../core/editor/editorUI'

export const CommandStr = 'mock.data.edit'
export class MockIniter extends DataEditorInitializer<MockEditor> {
  Initialize(): Promise<MockEditor> {
    return new Promise(async (resolve, reject) => {
      await AsyncFunc()
      resolve(new MockEditor())
    })
  }
}
export class MockEditor extends DataEditor {
  constructor(ui: DataEditorUI) {
    super(ui)
  }
  // protected initializer = new MockIniter()
  // protected commandStr: string = CommandStr
}

export class MockUI implements DataEditorUI {}
export const AsyncFunc = (
  ms: number = 0,
  shouldReject: boolean = false
): Promise<void> => {
  return new Promise((resolve, reject) => {
    shouldReject ? reject('Forced rejection') : resolve()
  })
}
