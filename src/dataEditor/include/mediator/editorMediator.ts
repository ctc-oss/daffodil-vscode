export interface MediatorNotification {
  readonly command: number
  data: any
}
export interface IEditorMediator {
  notify<T extends MediatorNotification>(
    notification: T,
    from: IEditorComponent
  ): any
}
export abstract class IEditorComponent {
  constructor(
    protected mediator: IEditorMediator,
    readonly componentId: string
  ) {}
}
