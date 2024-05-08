import * as vscode from 'vscode'
import * as editor_config from '../config'
import { DataEditor } from '../include/client/dataEditorClient'
import { OmegaEditService } from '../include/omegaEdit/omegaEditService'
import { DataEditorUI, UIInputHandler } from '../include/client/dataEditorUI'
import { SvelteWebviewInitializer } from '../svelteWebviewInitializer'
import {
  IEditorComponent,
  IEditorMediator,
} from '../include/service/editorService'

export class StandaloneEditor extends DataEditor implements vscode.Disposable {
  protected fileToEdit: string = ''
  protected editService: OmegaEditService | undefined
  protected ui: DataEditorWebviewPanel
  constructor(ctx: vscode.ExtensionContext, config: editor_config.Config) {
    super()
    this.ui = new DataEditorWebviewPanel(this, ctx)
  }

  dispose() {
    this.editService?.destroy()
  }

  notify(
    fromComponent: IEditorComponent,
    notification: { id: string | number; data: any }
  ): void {
    vscode.window.showInformationMessage(
      `Received ${notification} notification from ${fromComponent.componentId}. Sending ${notification.data} to UI`
    )
    this.ui.sendMessage(notification)
  }

  async getFile(): Promise<void> {
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

/*
UI capable inputs that need to send to service:
  Viewport:
    - seek
    - search
    - replace
    - edit (delete)
  Session:
    - createViewport ( for multiple viewports to display? )
*/
export class DataEditorWebviewPanel extends DataEditorUI {
  protected panel: vscode.WebviewPanel
  protected inputHandler: (input: any) => any = (msg) => {
    this.mediator.notify(this, msg)
  }
  private view: string = 'dataEditor'
  private svelteWebviewInitializer: SvelteWebviewInitializer

  constructor(mediator: IEditorMediator, context: vscode.ExtensionContext) {
    super(mediator, 'webviewPanel')
    this.svelteWebviewInitializer = new SvelteWebviewInitializer(context)
    this.panel = vscode.window.createWebviewPanel(
      this.view,
      '',
      { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
      { enableScripts: true, retainContextWhenHidden: true }
    )
    this.svelteWebviewInitializer.initialize(this.view, this.panel.webview)
    this.panel.webview.onDidReceiveMessage(this.inputHandler)
  }

  setTitle(title: string) {
    this.panel.title = title
  }

  sendMessage(msg: { id: string | number; data: any }): void {
    this.panel.webview.postMessage({ command: msg.id, data: msg.data })
  }
}
