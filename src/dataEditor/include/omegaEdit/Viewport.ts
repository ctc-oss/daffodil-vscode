import { ViewportDataResponse } from '@omega-edit/client'

export class Viewport {
  constructor(
    protected data: Uint8Array,
    protected capacity: number
  ) {}
  length() {
    return this.data.length
  }
}
