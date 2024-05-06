import * as vscode from 'vscode'
import * as editor_config from '../config'
import { DataEditor } from '../include/client/dataEditorClient'
import { OmegaEditService } from '../include/omegaEdit/omegaEditService'
import { DataEditorUI } from '../include/client/dataEditorUI'

export class StandaloneEditor extends DataEditor implements vscode.Disposable {
  protected fileToEdit: string = ''
  protected editService: OmegaEditService | undefined
  protected ui: DataEditorWebviewPanel | undefined = undefined
  constructor(ctx: vscode.ExtensionContext, config: editor_config.Config) {
    super()
  }

  dispose() {
    this.editService?.destroy()
  }

  notify(notification: { id: string; data: any }): void {
    vscode.window.showInformationMessage(
      `Received ${notification.id} notification. Sending ${notification.data} to UI`
    )
    if (notification.id === 'viewport-updated') {
      console.debug(notification.data)
    }
    this.ui?.sendMessage(notification)
  }
  initializeUI(ui: DataEditorWebviewPanel): void {
    this.ui = ui
  }
  async getFile(): Promise<void> {
    const fileUri = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: 'Select',
      canSelectFiles: true,
      canSelectFolders: false,
    })
    if (fileUri && fileUri[0]) this.fileToEdit = fileUri[0].fsPath
  }
}

export class DataEditorWebviewPanel implements DataEditorUI {
  protected panel: vscode.WebviewPanel
  private view: string = 'dataeditor'
  constructor(title: string) {
    this.panel = vscode.window.createWebviewPanel(
      this.view,
      title,
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    )
  }
  sendMessage(msg: any): void {
    this.panel.webview.postMessage(msg)
  }
  static async create(title: string): Promise<DataEditorWebviewPanel> {
    return new Promise((resolve, reject) => {
      resolve(new DataEditorWebviewPanel(title))
    })
  }
  async show(): Promise<void> {
    this.panel.reveal()
  }
}
