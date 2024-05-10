import {
  IEditorComponent,
  IEditorMediator,
  MediatorNotification,
} from '../mediator/editorMediator'
export interface IServiceRequest {}
export abstract class IEditService extends IEditorComponent {
  constructor(
    mediator: IEditorMediator,
    readonly onDisposal: () => any,
    id: string
  ) {
    super(mediator, id)
  }
  abstract request<T>(data: MediatorNotification<T>): any
  abstract setDataSource(editingFile: string): any
  destroy(): void {
    this.onDisposal()
  }
}

export interface IEditServiceProvider {
  getService(
    mediator: IEditorMediator,
    targetFile: string
  ): Promise<IEditService>
}
