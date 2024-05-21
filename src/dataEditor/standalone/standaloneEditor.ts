import * as vscode from 'vscode'
import * as editor_config from '../config'
import {
  DataEditor,
  DataEditorInitializer,
} from '../include/client/dataEditorClient'
import { OmegaEditService } from '../include/omegaEdit/omegaEditService'
import { OmegaEditServer } from '../include/omegaEdit/omegaEditServer'
import { IStatusUpdater } from '../include/status/IStatus'
import { DataEditorWebviewPanel } from './ui/webviewPanel'

export class StandaloneEditor extends DataEditor implements vscode.Disposable {
  protected fileToEdit: string = ''
  protected ui: DataEditorWebviewPanel
  protected editService: OmegaEditService | undefined = undefined
  constructor(ctx: vscode.ExtensionContext, config: editor_config.Config) {
    super()
    this.ui = new DataEditorWebviewPanel(this.mediator, ctx, () => {
      this.dispose()
    })
  }

  dispose() {
    this.editService?.destroy()
  }

  async getDataSource(): Promise<void> {
    const fileUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select',
      canSelectFiles: true,
      canSelectFolders: false,
    })
    if (fileUri && fileUri[0]) this.fileToEdit = fileUri[0].fsPath
    this.ui.setTitle(this.fileToEdit)
  }
}

export const StandaloneInitializer: DataEditorInitializer = {
  initialize: (params: { ctx: vscode.ExtensionContext }) => {
    return new Promise(async (resolve) => {
      const statusBar = new StatusBar()
      statusBar.update('[Data Editor]: Extracting Configuration Variables')
      let configVars = editor_config.extractConfigurationVariables()

      let server = new OmegaEditServer('127.0.0.1', configVars.port)
      await server.start(statusBar)
      statusBar.update('[Data Editor]: Server Startup Complete!')

      /* Moving on w/ assumption that server is up and running */
      const editor = new StandaloneEditor(params.ctx, configVars)
      await editor.getServiceFrom(server)
      statusBar.dispose()
      resolve(editor)
    })
  },
}

class StatusBar implements IStatusUpdater {
  private tag: string = ''
  private item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  )
  update(status: string) {
    this.item.text = this.tag + status
    this.item.show()
  }
  setTag(tag: string) {
    this.tag = '[' + tag + '] '
  }
  dispose() {
    this.item.dispose()
  }
}
