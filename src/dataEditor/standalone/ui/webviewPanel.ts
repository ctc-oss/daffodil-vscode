import { DataEditorUI } from '../../include/client/dataEditorUI'
import { DataEditorEvent } from '../../include/events'
import { Mediator } from '../../include/mediator/mediator'
import { SvelteWebviewInitializer } from '../../svelteWebviewInitializer'
import * as vscode from 'vscode'

export class DataEditorWebviewPanel extends DataEditorUI {
  protected postToWebview(type: string, content: any) {
    this.panel.webview.postMessage({
      command: type,
      data: content,
    })
  }

  protected registerEventHandlers(): void {
    this.mediator.register('viewportRefresh', (content) => {
      this.postToWebview('viewportRefresh', { ...content })
    })
    this.mediator.register('info', (content) => {
      this.postToWebview('info', { ...content })
    })
  }
  protected panel: vscode.WebviewPanel
  private view: string = 'dataEditor'
  private svelteWebviewInitializer: SvelteWebviewInitializer

  constructor(
    mediator: Mediator<DataEditorEvent>,
    context: vscode.ExtensionContext,
    onDisposal: () => any
  ) {
    super(mediator, 'webviewPanel')
    this.svelteWebviewInitializer = new SvelteWebviewInitializer(context)
    this.panel = vscode.window.createWebviewPanel(
      this.view,
      '',
      { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
      { enableScripts: true, retainContextWhenHidden: true }
    )
    this.svelteWebviewInitializer.initialize(this.view, this.panel.webview)
    this.panel.webview.onDidReceiveMessage((msg) => {
      console.log(msg)
    })
    this.panel.onDidDispose(() => {
      onDisposal()
    })
  }

  setTitle(title: string) {
    this.panel.title = title
  }
}
