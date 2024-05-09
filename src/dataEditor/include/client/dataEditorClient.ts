import { IEditorMediator, IEditorComponent } from '../mediator/editorMediator'
import { IEditService, IEditServiceProvider } from '../service/editorService'
import { DataEditorUI } from './dataEditorUI'
export abstract class DataEditor implements IEditorMediator {
  protected abstract fileToEdit: string
  protected abstract ui: DataEditorUI | undefined

  protected editService: IEditService | undefined = undefined

  abstract notify(fromComponent: IEditorComponent, notification: any): void
  protected abstract getDataSource(): Promise<void>

  filePath() {
    return this.fileToEdit
  }
  async getServiceFrom(provider: IEditServiceProvider) {
    await this.getDataSource()
    this.editService = await provider.getService(this, this.fileToEdit)
  }
}

export interface DataEditorInitializer {
  initialize(params: any): Promise<DataEditor>
}
