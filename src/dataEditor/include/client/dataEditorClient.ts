import { IEditService, IEditServiceProvider } from '../service/editorService'
import { DataEditorUI } from './dataEditorUI'
import { MappedMediator } from './mappedMediator'
export abstract class DataEditor {
  protected mediator = new MappedMediator()
  protected abstract fileToEdit: string
  protected abstract ui: DataEditorUI | undefined

  protected editService: IEditService | undefined = undefined

  protected abstract getDataSource(): Promise<void>

  filePath() {
    return this.fileToEdit
  }
  async getServiceFrom(provider: IEditServiceProvider) {
    await this.getDataSource()
    this.editService = await provider.getService(this.mediator, this.fileToEdit)
  }
}

export interface DataEditorInitializer {
  initialize(params: any): Promise<DataEditor>
}
