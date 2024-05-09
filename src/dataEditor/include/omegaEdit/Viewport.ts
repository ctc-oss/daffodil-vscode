import { modifyViewport } from '@omega-edit/client'
import { MediatorNotification } from '../mediator/editorMediator'

export class Viewport {
  static readonly Capacity: number = 1024
  constructor(
    readonly id: string,
    protected fileOffset: number,
    protected data: Uint8Array,
    public onDataUpdate: (event: Viewport) => void
  ) {
    // Validate some stuff
    onDataUpdate(this)
  }
  length() {
    return this.data.length
  }
  setOffset(offset: number) {
    modifyViewport(this.id, offset, Viewport.Capacity).then((response) => {
      this.data = response.getData_asU8()
      this.onDataUpdate(this)
    })
  }
  binaryData() {
    return this.data
  }
  offset() {
    return this.fileOffset
  }
}
