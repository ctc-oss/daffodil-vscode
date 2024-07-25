import * as vscode from 'vscode'
import { OmegaEditServerManager } from '../omegaEdit/server/server'
import { FilePathSourceStrategy } from '../omegaEdit'
import { DataEditor, DataEditorInitializer } from '../core/editor/dataEditor'
import { extractConfigurationVariables } from '../config'
import { WebviewPanelEditorUI } from '../webview/editorWebviewPanel'
import { OmegaEditSession } from '../omegaEdit/service/session'

export class StandaloneEditor extends DataEditor implements vscode.Disposable {
  static readonly commandStr = 'extension.data.edit'
  constructor(serviceClient: OmegaEditSession, ui: WebviewPanelEditorUI) {
    super(serviceClient, ui)
    ui.sendAsync(
      new Promise<number>((res) => {
        setTimeout(() => {
          console.log('Resolving now!')
          res(420)
        }, 3000)
      })
    )
    this.ui.onClosed(() => {
      this.serviceClient.close()
    })
    serviceClient.onRequestProcessed = (asyncResponse) => {
      ui.sendAsync(asyncResponse)
    }
    this.serviceClient.request({ command: 'getFileInfo' })
  }
  dispose() {
    // this.editService.dispose()
  }
}

export class StandaloneInitializer extends DataEditorInitializer<StandaloneEditor> {
  constructor(readonly getTarget: FilePathSourceStrategy) {
    super()
  }
  Initialize(ctx: vscode.ExtensionContext): Promise<StandaloneEditor> {
    return new Promise(async (resolve, reject) => {
      const target = await this.getTarget.get()
      const server = await OmegaEditServerManager.Connect(
        extractConfigurationVariables
      )
      const service = await server.getService()

      const client = await service.register(target)
      resolve(
        new StandaloneEditor(
          client,
          new WebviewPanelEditorUI(ctx, target.fileName())
        )
      )
    })
  }
}
