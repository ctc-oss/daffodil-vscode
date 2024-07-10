import * as vscode from 'vscode'
// import { DataEditorUI } from './core/editor/editorUI'
// import { OmegaEditService } from './omegaEdit/editService'
import { OmegaEditServerManager } from './omegaEdit/server'
import { FilePath, FilePathSourceStrategy } from './omegaEdit'
import { DataEditor, DataEditorInitializer } from './core/editor/dataEditor'
import { DataEditorUI } from './core/editor/editorUI'
import { OmegaEditService } from './omegaEdit/editService'
import { extractConfigurationVariables } from './config'

export class WebviewPanelEditorUI implements DataEditorUI {
  private panel: vscode.WebviewPanel
  constructor(title: string, focus: boolean = true) {
    this.panel = vscode.window.createWebviewPanel(
      'dataEditorView',
      title, // Target file from selector
      {
        viewColumn: focus ? vscode.ViewColumn.Active : vscode.ViewColumn.Beside, // Standalone and DFDLDebug difference
        preserveFocus: true,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    )
    this.panel.webview.onDidReceiveMessage(
      () => {} /* Standalone and DFDLDebug difference */
    )
  }
  configuration() {
    throw new Error('Method not implemented.')
  }
  configure(configItem: string, value: any): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
export class StandaloneEditor extends DataEditor implements vscode.Disposable {
  static readonly commandStr = 'extension.data.edit'
  constructor(service: OmegaEditService, targetFile: FilePath) {
    super(targetFile, service)
  }
  dispose() {
    // this.editService.dispose()
  }
}

export class StandaloneInitializer extends DataEditorInitializer<StandaloneEditor> {
  constructor(readonly getTarget: FilePathSourceStrategy) {
    super()
  }
  Initialize(): Promise<StandaloneEditor> {
    return new Promise(async (resolve, reject) => {
      const target = await this.getTarget.get()
      const server = await OmegaEditServerManager.Connect(
        extractConfigurationVariables
      )
      const editService = await server.getService()
      resolve(new StandaloneEditor(editService, target))
    })
  }
}
