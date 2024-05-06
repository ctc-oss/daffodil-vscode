import * as vscode from 'vscode'
import * as editor_config from '../config'
import { DataEditor } from '../include/client/dataEditorClient'
import { OmegaEditService } from '../include/omegaEdit/omegaEditService'
import { DataEditorUI } from '../include/client/dataEditorUI'
import { SvelteWebviewInitializer } from '../svelteWebviewInitializer'

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
    this.ui?.sendMessage(notification)
  }
  initializeUI(ui: DataEditorWebviewPanel): void {
    this.ui = ui
    setTimeout(() => {
      // Simulate UI Request to scroll viewport
      const request = {
        type: 'scroll',
        viewportId: '',
        offset: 2000,
      }
      console.debug('Sending scrollViewport request')
      // The UI will have access to the same Viewport data as the sessio nand service
      // So upon requests, it will populate a 'viewportId' member
      this.editService!.getViewport(request.viewportId)?.setOffset(
        request.offset
      )
    }, 4000)
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
  private svelteWebviewInitializer: SvelteWebviewInitializer
  constructor(context: vscode.ExtensionContext, title: string) {
    this.panel = vscode.window.createWebviewPanel(
      this.view,
      title,
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    )
    this.svelteWebviewInitializer = new SvelteWebviewInitializer(context)
    this.svelteWebviewInitializer.initialize(this.view, this.panel.webview)
  }
  sendMessage(msg: any): void {
    this.panel.webview.postMessage(msg)
  }
  async show(): Promise<void> {
    this.panel.reveal()
  }
}
