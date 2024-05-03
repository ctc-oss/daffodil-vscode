import * as vscode from 'vscode'
import * as editor_config from '../config'
import { DataEditor } from '../include/client/dataEditorClient'
import { IEditService } from '../include/service/editorService'

export class StandaloneEditor extends DataEditor {
  protected fileToEdit: string = ''
  constructor(ctx: vscode.ExtensionContext, config: editor_config.Config) {
    super()
  }
  async getFile(): Promise<void> {
    const fileUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select',
      canSelectFiles: true,
      canSelectFolders: false,
    })
    if (fileUri && fileUri[0]) {
      this.fileToEdit = fileUri[0].fsPath
      // this.panel.title = path.basename(this.fileToEdit)
      // await this.setupDataEditor()
    }
  }

  async setupService(): Promise<void> {}
}
