export interface IServiceMediator {
  notify(notification: { id: string; data: any }): any
}
export abstract class IEditService {
  constructor(readonly mediator: IServiceMediator) {}
  abstract set(editingFile: string): any
  abstract destroy(): void
}
