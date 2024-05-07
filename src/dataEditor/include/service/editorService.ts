export interface IEditorMediator {
  notify(
    fromComponent: IEditorComponent,
    notification: { id: string; data: any }
  ): any
}
export abstract class IEditorComponent {
  constructor(
    protected mediator: IEditorMediator,
    readonly componentId: string
  ) {}
}
export abstract class IEditService extends IEditorComponent {
  constructor(mediator: IEditorMediator, id: string) {
    super(mediator, id)
  }
  abstract request(data: any): any
  abstract set(editingFile: string): any
  abstract destroy(): void
}

export interface IEditServiceProvider {
  getService(
    mediator: IEditorMediator,
    targetFile: string
  ): Promise<IEditService>
}
