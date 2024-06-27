import { describe } from 'mocha'
abstract class DataEditor {
  abstract editorService: any
  abstract ui: any
}
class MockEditor extends DataEditor {
  editorService: any
  ui: any
}
describe('Data Editor Interface and Abstraction Behavior', () => {
  it('Should require UI and Editor Service abstractions', () => {})
})
