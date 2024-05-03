import { IEditServiceProvider } from '../server/Server'
import { IEditService } from '../service/editorService'
export abstract class DataEditor {
  protected abstract fileToEdit: string
  protected editService: IEditService | undefined = undefined
  async initialize(provider: IEditServiceProvider) {
    await this.getFile()
    this.editService = await provider.getService(this.fileToEdit)
  }
  protected abstract getFile(): Promise<void>
}
export interface DataEditorUI {
  show(): Promise<void>
}
