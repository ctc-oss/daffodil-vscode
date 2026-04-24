import type { BytesPerRow, ByteValue } from 'ext_types'
import { ViewportState } from './ViewportState.svelte.ts'
import { displaySettings } from 'stores/displaySettings.svelte.ts'
// import { displaySettings } from "stores/displaySettings.svelte.ts";

export type ViewportLineData = {
  // offset: string
  // fileLine: number
  bytes: Array<number>
  // bytes: Array<ByteValue>
  // highlight: 'even' | 'odd'
}
export type ViewportFeed = TestLineData[]
export type TestLineData = {
  bytes: Array<number>
}
export class ViewportDataFeed {
  constructor(private viewportRef: ViewportState) {
    // this.#viewportRef = viewport
  }
  // #viewportRef = $state<ViewportState>()
  // #feedLineStartIndex = $derived.by<number>(() => { })

  // #feedLineStartIndex = $derived.by<number>(() => {
  // return if(displaySettings.bytesPerRow !== this.#dataFeed)
  // if (displaySettings.bytesPerRow !== this.dataFeed[0].bytes.length)
  // return offsetToLineNum(parseInt(this.dataFeed[0].offset, radixSelections.address), displaySettings.bytesPerRow, this.#fileOffsetState)
  // return Math.max(0, Math.min(getMaxTopLine(this), this.feedLineTop()))
  // })
  #dataFeed = $derived.by<ViewportFeed>(() => {
    let ret: ViewportLineData[] = []
    let line: number[] = []
    let currentLineIndex = 0
    const dataRef = this.viewportRef.data()
    line = Array.from(dataRef)
    dataRef.forEach((byteValue, byteIndex) => {
      for (let i = 0; i < displaySettings.bytesPerRow; i++) {
        line.push(byteValue)
      }
      currentLineIndex += 1
      ret.push({ bytes: line })
    })
    return ret
  })

  feed() {
    return this.#dataFeed
  }

  protected generateFeed() {
    let ret: ViewportFeed = []
    // for(let i = )
  }
}

export function getOffsetDivisibleBy(
  offset: number,
  addLineNum: number = 0
): number {
  const bytesPerRow = displaySettings.bytesPerRow
  return (
    Math.floor(offset / bytesPerRow) * bytesPerRow + bytesPerRow * addLineNum
  )
}

export function offsetToLineNum(
  offset: number,
  viewportStartOffset: number = 0
): number {
  const bytesPerRow = displaySettings.bytesPerRow
  const nearestBPRdivisibleTargetFileOffset = getOffsetDivisibleBy(
    offset,
    bytesPerRow
  )
  const nearestBPRdivisibleViewportFileOffset = getOffsetDivisibleBy(
    viewportStartOffset,
    bytesPerRow
  )
  return (
    (nearestBPRdivisibleTargetFileOffset -
      nearestBPRdivisibleViewportFileOffset) /
    bytesPerRow
  )
}
