import { modifyViewport } from '@omega-edit/client'

export class Viewport {
  static readonly ViewportCapacity: number = 1024
  constructor(
    readonly id: string,
    protected fileOffset: number,
    protected data: Uint8Array,
    protected capacity: number,
    public onDataUpdate: (viewport: Viewport) => void
  ) {
    // Validate some stuff
    onDataUpdate(this)
  }
  length() {
    return this.data.length
  }
  setOffset(offset: number) {
    modifyViewport(this.id, offset, this.capacity).then((response) => {
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
