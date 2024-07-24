import { ExtensionContext, ViewColumn, WebviewPanel, window } from 'vscode'
import { DataEditorUI } from '../core/editor/editorUI'
import { SvelteWebviewInitializer } from '../svelteWebviewInitializer'

export class WebviewPanelEditorUI implements DataEditorUI {
  private panel: WebviewPanel
  private svelteWebviewInitializer: SvelteWebviewInitializer
  constructor(ctx: ExtensionContext, title: string, focus: boolean = true) {
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
        console.log(`UI Input Received: ${msg}`)
        const response = await this.onInputEvent(msg)
        this.updateUI(response)
      } /* Standalone and DFDLDebug difference */
    )
    this.svelteWebviewInitializer = new SvelteWebviewInitializer(ctx)
    this.svelteWebviewInitializer.initialize('dataEditor', this.panel.webview)
  }
  onInputEvent: (input: any) => any = () => {
    throw 'unimplemented input event handler'
  }
  updateUI(data: any) {
    console.log(`Data from EXT: ${data}`)
    this.panel.webview.postMessage(data)
  }
  onClosed(disposal: (e: void) => any) {
    this.panel.onDidDispose(disposal)
  }
}
