import * as vscode from 'vscode'
import { FilePath, FilePathSourceStrategy } from './omegaEdit'
import {
  DataEditor,
  DataEditorInitializer,
  EditorCommand,
} from './core/editor/dataEditor'
import * as editor_config from './config'
import {
  StandaloneEditor,
  StandaloneInitializer,
} from './standalone/standaloneEditor'

const editorCommands: Map<
  EditorCommand['command'],
  EditorCommand['initializer']
> = new Map()

export function RegisterEditor(command: EditorCommand): void {
  editorCommands.set(command.command, command.initializer)
}
class DataEditorManager implements vscode.Disposable {
  private editors: DataEditor[] = []
  private disposables: vscode.Disposable[] = []
  constructor() {
    RegisterEditor(DefaultEditorCommand)
  }
  dispose(): void {
    this.editors = []
    this.disposables.forEach((item) => {
      item.dispose()
    })
  }
  async Run<D extends DataEditor>(
    initializer: DataEditorInitializer<D>
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const editor = await initializer.Initialize()
      this.editors.push(editor)
      resolve()
    })
  }
}
export const VSCodeFileSelector: FilePathSourceStrategy = {
  get: () => {
    return new Promise(async (resolve, reject) => {
      const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select',
        canSelectFiles: true,
        canSelectFolders: false,
      })
      if (fileUri && fileUri[0]) {
        resolve(new FilePath(fileUri[0].fsPath))
      }
    })
  },
}

const DefaultEditorCommand: EditorCommand = {
  command: StandaloneEditor.commandStr,
  initializer: new StandaloneInitializer(VSCodeFileSelector),
}

let Manager: DataEditorManager

function registerAllEditorCommands(ctx: vscode.ExtensionContext) {
  editorCommands.forEach((initer, command) => {
    ctx.subscriptions.push(
      vscode.commands.registerCommand(command, async () => {
        await Manager.Run(initer)
      })
    )
  })
}
export function activate(ctx: vscode.ExtensionContext) {
  const config = editor_config.extractConfigurationVariables() // Omega Edit Server specific configurations
  Manager = new DataEditorManager()

  registerAllEditorCommands(ctx)
  ctx.subscriptions.push(Manager)
}
