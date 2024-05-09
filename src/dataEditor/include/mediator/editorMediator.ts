export interface IEditorMediator {
  notify(
    fromComponent: IEditorComponent,
    notification: { id: string | number; data: any }
  ): any
}
export abstract class IEditorComponent {
  constructor(
    protected mediator: IEditorMediator,
    readonly componentId: string
  ) {}
}
