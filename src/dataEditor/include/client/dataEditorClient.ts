import {
  IEditService,
  IEditServiceProvider,
  IEditorComponent,
  IEditorMediator,
} from '../service/editorService'
import { DataEditorUI } from './dataEditorUI'
export abstract class DataEditor implements IEditorMediator {
  protected abstract fileToEdit: string
  protected abstract ui: DataEditorUI | undefined

  protected editService: IEditService | undefined = undefined

  // abstract initializeUI(ui: DataEditorUI): void
  // abstract initUI(): void
  abstract notify(
    fromComponent: IEditorComponent,
    notification: { id: string; data: any }
  ): void
  protected abstract getFile(): Promise<void>

  filePath() {
    return this.fileToEdit
  }
  async getServiceFrom(provider: IEditServiceProvider) {
    await this.getFile()
    this.editService = await provider.getService(this, this.fileToEdit)
  }
}
