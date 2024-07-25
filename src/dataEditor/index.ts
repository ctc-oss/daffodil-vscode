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
import { OmegaEditServerManager } from './omegaEdit/server/server'

const editorCommands: Map<
  EditorCommand['command'],
  EditorCommand['initializer']
> = new Map()

class DataEditorManager implements vscode.Disposable {
  private editors: DataEditor[] = []
  private disposables: vscode.Disposable[] = []
  constructor(readonly ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(this)

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
      const editor = await initializer.Initialize(this.ctx)
      this.editors.push(editor)
      resolve()
    })
  }
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

export function RegisterEditor(command: EditorCommand): void {
  editorCommands.set(command.command, command.initializer)
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

export function activate(ctx: vscode.ExtensionContext) {
  Manager = new DataEditorManager(ctx)

  registerAllEditorCommands(ctx)
  ctx.subscriptions.push(OmegaEditServerManager.disposeAllServers())
}
