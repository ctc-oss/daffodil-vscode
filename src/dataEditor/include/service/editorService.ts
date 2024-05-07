export interface IServiceMediator {
  notify(notification: { id: string; data: any }): any
}
export abstract class IEditService {
  constructor(protected mediator: IServiceMediator) {}
  abstract request(data: any): any
  abstract set(editingFile: string): any
  abstract destroy(): void
}

export interface IEditServiceProvider {
  getService(
    mediator: IServiceMediator,
    targetFile: string
  ): Promise<IEditService>
}
