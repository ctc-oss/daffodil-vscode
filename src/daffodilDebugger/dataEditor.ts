import * as vscode from 'vscode'
import {
  DataEditor,
  DataEditorInitializer,
} from '../dataEditor/core/editor/dataEditor'
import { WebviewPanelEditorUI } from '../dataEditor/standalone/standaloneEditor'
import { GetDataSourceStrategy } from '../dataEditor/omegaEdit'
import { RegisterEditor } from '../dataEditor'
import { getCurrentConfig } from '../utils'

export namespace DFDLDebugDataEditor {
  export const commandStr = 'extension.debug.data.edit'
}

class Editor extends DataEditor implements vscode.Disposable {
  constructor(ui: WebviewPanelEditorUI) {
    super(ui)
  }
  dispose() {
    throw new Error('Method not implemented.')
  }
}

export const DFDLDebugTargetFile: GetDataSourceStrategy = () => {
  return new Promise((resolve, reject) => {
    const config = getCurrentConfig()
    resolve(config.data)
  })
}
export class DFDLDebugEditorInitializer extends DataEditorInitializer<Editor> {
  constructor(readonly targetFile: GetDataSourceStrategy) {
    super()
  }
  Initialize(): Promise<Editor> {
    throw new Error('Method not implemented.')
  }
}

RegisterEditor({
  command: DFDLDebugDataEditor.commandStr,
  initializer: new DFDLDebugEditorInitializer(DFDLDebugTargetFile),
})
