import { ExtensionContext } from 'vscode'
import {
  DataSource,
  EditServiceClient,
  ServiceUser,
} from '../service/editService'
import { DataEditorUI } from './editorUI'

export abstract class DataEditorInitializer<D extends DataEditor = DataEditor> {
  abstract Initialize(ctx: ExtensionContext): Promise<D>
}

export type EditorCommand = {
  command: string
  initializer: DataEditorInitializer
}

export abstract class DataEditor implements ServiceUser<DataSource> {
  constructor(
    protected serviceClient: EditServiceClient,
    protected ui: DataEditorUI
  ) {
    serviceClient.onDidProcessRequest = (response) => {
      this.ui.updateUI(response)
    }
    ui.onInputEvent = (input) => {
      this.serviceClient.request(input)
    }
  }
  dataSource(): DataSource {
    throw ''
  }
}
