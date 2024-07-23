import { ExtensionContext, ViewColumn, WebviewPanel, window } from 'vscode'
import { DataEditorUI } from '../core/editor/editorUI'
import { SvelteWebviewInitializer } from '../svelteWebviewInitializer'

export class WebviewPanelEditorUI implements DataEditorUI {
  private panel: WebviewPanel
  private svelteWebviewInitializer: SvelteWebviewInitializer
  constructor(
    ctx: ExtensionContext,
    title: string,
    clientRequestHandle: (request: any) => any,
    focus: boolean = true
  ) {
    this.onInputEvent = clientRequestHandle
    this.panel = window.createWebviewPanel(
      'dataEditorView',
      title, // Target file from selector
      {
        viewColumn: focus ? ViewColumn.Active : ViewColumn.Beside, // Standalone and DFDLDebug difference
        preserveFocus: true,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    )
    this.panel.webview.onDidReceiveMessage(
      async (msg) => {
        const response = await this.onInputEvent(msg)
        this.updateUI(response)
      } /* Standalone and DFDLDebug difference */
    )
    this.svelteWebviewInitializer = new SvelteWebviewInitializer(ctx)
    this.svelteWebviewInitializer.initialize(
      'standalone-data-editorf',
      this.panel.webview
    )
  }
  onInputEvent: (input: any) => any
  updateUI(data: any) {
    this.panel.webview.postMessage(data)
  }
}
