import { IEditorComponent, IEditorMediator } from '../mediator/editorMediator'

export abstract class IEditService extends IEditorComponent {
  constructor(mediator: IEditorMediator, id: string) {
    super(mediator, id)
  }
  abstract request(data: any): any
  abstract setDataSource(editingFile: string): any
  abstract destroy(): void
}

export interface IEditServiceProvider {
  getService(
    mediator: IEditorMediator,
    targetFile: string
  ): Promise<IEditService>
}
