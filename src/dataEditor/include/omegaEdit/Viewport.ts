import { createViewport, modifyViewport } from '@omega-edit/client'

export class Viewport {
  constructor(
    readonly id: string,
    protected data: Uint8Array,
    protected capacity: number,
    public onDataUpdate: (viewport: Viewport) => void
  ) {}
  length() {
    return this.data.length
  }
  setOffset(offset: number) {
    modifyViewport(this.id, offset, this.capacity).then((response) => {
      this.data = response.getData_asU8()
      this.onDataUpdate(this)
    })
  }
}
