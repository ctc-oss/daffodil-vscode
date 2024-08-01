import { Disposable, ExtensionContext } from 'vscode'
import { DataSource, EditServiceClient } from '../service/editService'
import { DataEditorUI } from './editorUI'

export abstract class DataEditorInitializer<D extends DataEditor = DataEditor> {
  abstract Initialize(ctx: ExtensionContext): Promise<D>
}

export type EditorCommand = {
  command: string
  initializer: DataEditorInitializer
}

export abstract class DataEditor implements Disposable {
  constructor(
    protected serviceClient: EditServiceClient,
    protected ui: DataEditorUI
  ) {
    serviceClient.addResponseListener((response) => {
      this.ui.updateUI(response)
    })

    ui.onInputEvent = (input) => {
      this.serviceClient.request(input)
    }
    ui.onClosed(() => {
      this.dispose()
    })
  }
  dispose() {
    this.serviceClient.close()
  }
  dataSource(): DataSource {
    throw ''
  }
}
