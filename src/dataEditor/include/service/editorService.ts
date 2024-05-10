import {
  IEditorComponent,
  IEditorMediator,
  MediatorNotification,
} from '../mediator/editorMediator'
export interface IServiceRequest {}
export abstract class IEditService extends IEditorComponent {
  constructor(mediator: IEditorMediator, id: string) {
    super(mediator, id)
  }
  abstract request<T>(data: MediatorNotification<T>): any
  abstract setDataSource(editingFile: string): any
  abstract destroy(): void
}

export interface IEditServiceProvider {
  getService(
    mediator: IEditorMediator,
    targetFile: string
  ): Promise<IEditService>
}
