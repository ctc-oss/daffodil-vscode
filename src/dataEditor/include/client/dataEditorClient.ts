import { IEditService, IEditServiceProvider } from '../service/editorService'
import { DataEditorEvent } from '../events'
import { DataEditorUI } from './dataEditorUI'
import { MediatorMap } from '../mediator/mediatorMap'
export abstract class DataEditor {
  protected mediator = new MediatorMap<DataEditorEvent>()
  protected abstract ui: DataEditorUI<DataEditorEvent> | undefined

  protected editService: IEditService<DataEditorEvent> | undefined = undefined

  protected abstract getFileToEdit(): Promise<string>

  async getServiceFrom(provider: IEditServiceProvider<DataEditorEvent>) {
    this.editService = await provider.getService(
      this.mediator,
      await this.getFileToEdit()
    )
  }
}

export interface DataEditorInitializer {
  initialize(params: any): Promise<DataEditor>
}
