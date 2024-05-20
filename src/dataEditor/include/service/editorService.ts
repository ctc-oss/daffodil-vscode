import { Mediator, MediatorComponent } from '../mediator/mediator'
export interface IServiceRequest {}
export abstract class IEditService extends MediatorComponent {
  constructor(
    mediator: Mediator,
    readonly onDisposal: () => any,
    id: string
  ) {
    super(mediator)
  }
  abstract setDataSource(editingFile: string): any
  destroy(): void {
    this.onDisposal()
  }
}

export interface IEditServiceProvider {
  getService(mediator: Mediator, targetFile: string): Promise<IEditService>
}
