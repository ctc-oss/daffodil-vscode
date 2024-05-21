import { IEditService, IEditServiceProvider } from '../service/editorService'
import { DataEditorEvent } from '../events'
import { DataEditorUI } from './dataEditorUI'
import { MediatorMap } from '../mediator/mediatorMap'
export abstract class DataEditor {
  protected mediator = new MediatorMap<DataEditorEvent>()
  protected abstract fileToEdit: string
  protected abstract ui: DataEditorUI | undefined

  protected editService: IEditService<DataEditorEvent> | undefined = undefined

  protected abstract getDataSource(): Promise<void>

  filePath() {
    return this.fileToEdit
  }
  async getServiceFrom(provider: IEditServiceProvider<DataEditorEvent>) {
    await this.getDataSource()
    this.editService = await provider.getService(this.mediator, this.fileToEdit)
  }
}

export interface DataEditorInitializer {
  initialize(params: any): Promise<DataEditor>
}

/* Initializer Chain */
export interface InitializerChain {
  handle(request: any): any
}
export class BaseChain implements InitializerChain {
  protected next: InitializerChain = new BuildChain()
  handle(request: any): void {
    throw new Error('Method not implemented.')
  }
  setNext(chain: InitializerChain): void {
    throw new Error('Method not implemented.')
  }
}
export class InitialChain extends BaseChain {}
export class BuildChain implements InitializerChain {
  handle(request: any): Promise<DataEditor> {
    throw new Error('Method not implemented.')
  }
}
