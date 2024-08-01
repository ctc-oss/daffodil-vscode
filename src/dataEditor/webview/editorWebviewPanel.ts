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
    this.panel.webview.postMessage(data).then(undefined, (rejected) => {
      console.log(`Panel rejected postMessage: ${rejected}`)
    })
  }

  /// `postMessage` can only send JSON serializable data
  sendAsync(p: Promise<any>) {
    this.panel.webview.postMessage({ type: `async-pending` })

    p.then((data) => {
      this.panel.webview.postMessage(data)
    })
  }
  onClosed(disposal: (e: void) => any) {
    this.panel.onDidDispose(() => {
      disposal()
      this.panel.dispose()
    })
  }
}
