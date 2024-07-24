import * as vscode from 'vscode'
// import { DataEditorUI } from './core/editor/editorUI'
// import { OmegaEditService } from './omegaEdit/editService'
import { OmegaEditServerManager } from '../omegaEdit/server'
import { FilePath, FilePathSourceStrategy } from '../omegaEdit'
import { DataEditor, DataEditorInitializer } from '../core/editor/dataEditor'
import { OmegaEditService, OmegaEditSession } from '../omegaEdit/editService'
import { extractConfigurationVariables } from '../config'
import { EditServiceClient } from '../core/service/editService'
import { WebviewPanelEditorUI } from '../webview/editorWebviewPanel'

export class StandaloneEditor extends DataEditor implements vscode.Disposable {
  static readonly commandStr = 'extension.data.edit'
  constructor(serviceClient: OmegaEditSession, ui: WebviewPanelEditorUI) {
    super(serviceClient, ui)
    this.ui.onClosed(() => {
      this.serviceClient.close()
    })
    this.serviceClient.request({ command: 'getFileInfo' })
    // const ui: UI = {
    //   onDidReceiveMessage: (msg) => {
    //     if(msg.type === 'edit') service.process(msg, (response) => {
    //       ui.send(response)
    //     })
    //   },
    //   send: (msg) => { console.log(msg) }
    // }
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
