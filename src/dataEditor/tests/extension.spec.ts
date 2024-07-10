import { describe } from 'mocha'
import {
  DataEditor,
  DataEditorInitializer,
  EditorCommand,
} from '../core/editor/dataEditor'
import assert from 'assert'
import {
  CommandMap,
  editorCommands,
  RegisterCommand,
  vscodeCommands,
  RunCommand,
} from './utils/extension'
import { AsyncFunc, MockEditor } from './utils/fixtures'

const CommandStr = 'mock.data.edit'
class MockIniter extends DataEditorInitializer<MockEditor> {
  Initialize(): Promise<MockEditor> {
    return new Promise(async (resolve, reject) => {
      await AsyncFunc()
      resolve(new MockEditor())
    })
  }
}
class Manager {
  editors: DataEditor[] = []
  editorActivations: EditorCommand[] = []
  activations: Map<EditorCommand['command'], () => Promise<void>> = new Map()
  __invoke(initializer: DataEditorInitializer): Promise<void> {
    return new Promise(async (res, rej) => {
      const editor = await initializer.Initialize()
      this.editors.push(editor)
      res()
    })
  }
}

const manager = new Manager()

function Activate(commands: CommandMap) {
  editorCommands.forEach((initer, command) => {
    commands.set(command, async () => {
      await manager.__invoke(initer)
    })
  })
}

describe('Data Editor Extension Behavior', () => {
  describe('Extension Interface Functionality', () => {
    it('Should reject if an editor command is already registered', () => {
      RegisterCommand({
        command: CommandStr,
        initializer: new MockIniter(),
      })
    })
    it('Should register commands of the Manager invoking an initializer by a command string', () => {
      Activate(vscodeCommands)
      assert.equal(vscodeCommands.size, 1)
      assert(vscodeCommands.get(CommandStr))
    })
  })
  describe('Manager Behavior', () => {
    assert(manager)
    it('Should be the invoker of DataEditorInitializers', async () => {
      await RunCommand(CommandStr)
    })
    it('Should manage active editor lifetimes', () => {
      assert.fail('Need to implement')
    })
  })
})
