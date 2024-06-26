import { Mediator, MediatorComponent } from '../mediator/mediator'
export abstract class IEditService<
  EventType,
> extends MediatorComponent<EventType> {
  constructor(
    mediator: Mediator<EventType>,
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

export interface IEditServiceProvider<EventType> {
  getService(
    mediator: Mediator<EventType>,
    targetFile: string
  ): Promise<IEditService<EventType>>
}
