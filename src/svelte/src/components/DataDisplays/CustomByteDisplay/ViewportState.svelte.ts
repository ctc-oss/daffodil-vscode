import type { BytesPerRow, ViewportRefreshResponse } from 'ext_types'
import { offsetToLineNum, type ViewportLineData } from './DataFeed.svelte.ts'
import { displaySettings } from 'stores/displaySettings.svelte.ts'
import { numDisplayLines } from 'stores/format/index.svelte.ts'
import type {} from 'ext_types/messages.ts'

export type ViewportFetchBoundary = {
  upper: number
  lower: number
}

export class ViewportState {
  constructor(private id: string) {
    this.id = id
  }
  // id = $state<string>('')
  #data = $state<Uint8Array>(new Uint8Array())
  #fileOffset = $state<number>(-1)
  #length = $state<number>(-1)
  #capacity = $state<number>(-1)
  #bytesLeft = $state<number>(-1)
  #offsetMax = $state(-1)

  viewportId() {
    return this.id
  }
  data() {
    return this.#data
  }
  fileOffset() {
    return this.#fileOffset
  }
  length() {
    return this.#length
  }
  capacity() {
    return this.#capacity
  }
  bytesLeft() {
    return this.#bytesLeft
  }
  offsetMax() {
    return this.#offsetMax
  }

  #boundaries = $derived<ViewportFetchBoundary>({
    upper: getFetchBoundary('upper', this, displaySettings.bytesPerRow),
    lower: this.#fileOffset,
  })
  boundaries() {
    return this.#boundaries
  }
  isInitialized() {
    return this.#data.length > 0
  }
  update(response: ViewportRefreshResponse) {
    const { bytesLeft, capacity, data, fileOffset, length, viewportId } =
      response

    if (viewportId != this.id && this.id !== '')
      throw `Response ID (${response.viewportId}) does not match viewport ID (${this.id})`

    this.#capacity = capacity
    this.#bytesLeft = bytesLeft
    this.#data = data
    this.#fileOffset = fileOffset
    this.#length = length
    this.#offsetMax = fileOffset + bytesLeft + length
  }
  reset(id?: string) {
    this.#bytesLeft = -1
    this.#data = new Uint8Array(0)
    this.#fileOffset = -1
    this.#length = -1
    this.#offsetMax = -1
    this.#capacity - 1
    if (id) this.id = id
  }
}
export type FetchBoundary = 'upper' | 'lower'
function getFetchBoundary(
  type: FetchBoundary,
  viewport: ViewportState,
  numBytesPerRow: BytesPerRow = displaySettings.bytesPerRow
) {
  if (type == 'lower') return viewport.fileOffset()

  const numBytesDisplayed = numDisplayLines() * numBytesPerRow
  const boundary =
    viewport.length() >= numBytesDisplayed
      ? viewport.fileOffset() + viewport.length() - numBytesDisplayed
      : viewport.length()
  return boundary
}

export function getMaxTopLine(
  viewport: ViewportState,
  numBytesPerRow: BytesPerRow = displaySettings.bytesPerRow
) {
  const maxOffset = Math.max(
    0,
    viewport.length() - numDisplayLines() * numBytesPerRow
  )
  const lineTopMax = offsetToLineNum(
    maxOffset + viewport.fileOffset(),
    viewport.fileOffset()
  )
  return lineTopMax + 1
}
