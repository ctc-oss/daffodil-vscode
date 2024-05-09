import * as vscode from 'vscode'
import * as editor_config from '../config'
import {
  DataEditor,
  DataEditorInitializer,
} from '../include/client/dataEditorClient'
import { OmegaEditService } from '../include/omegaEdit/omegaEditService'
import { DataEditorUI } from '../include/client/dataEditorUI'
import { SvelteWebviewInitializer } from '../svelteWebviewInitializer'
import { OmegaEditServer } from '../include/omegaEdit/omegaEditServer'
import { IStatusUpdater } from '../include/status/IStatus'
import {
  IEditorComponent,
  IEditorMediator,
  MediatorNotification,
} from '../include/mediator/editorMediator'

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

  notify<T>(notification: T, from: IEditorComponent): void {
    from.componentId === this.ui.componentId
      ? this.editService?.request({ type: '', data: 0 })
      : this.ui.sendMessage(notification)
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
    this.mediator.notify(msg, this)
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

  sendMessage<T>(msg: T): void {
    this.panel.webview.postMessage({ command: 0, data: msg })
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
