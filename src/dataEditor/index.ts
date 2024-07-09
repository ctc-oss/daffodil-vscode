import * as vscode from 'vscode'
import { DataEditor, DataEditorInitializer } from './core/editor'
import {
  FilePath,
  GetTargetFileStrategy,
  StandaloneInitializer,
} from './standaloneEditor'

export class DataEditorManager implements vscode.Disposable {
  private editors: DataEditor[] = []
  private disposables: vscode.Disposable[] = []

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
export const VSCodeFileSelector: GetTargetFileStrategy = () => {
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
}
export const DataEditorCommand = 'extension.data.edit'
const DefaultInitializer = new StandaloneInitializer(VSCodeFileSelector)
let Manager: DataEditorManager

export function activate(ctx: vscode.ExtensionContext) {
  Manager = new DataEditorManager()

  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      DataEditorCommand,
      async (init: DataEditorInitializer = DefaultInitializer) => {
        Manager.Run(init)
      }
    )
  )
  ctx.subscriptions.push(Manager)
  // ctx.subscriptions.push(OmegaEditServerManager.dispose)
}
