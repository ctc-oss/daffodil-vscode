// // import { numDisplayLines, radixSelections } from "stores/format/index.svelte"
// // import { byte_value_string, type ByteValue } from "./BinaryData"
// // import { displaySettings } from "stores/displaySettings.svelte.ts"
// import type { BytesPerRow, ByteValue, RadixValues } from "ext_types"
// import { radixBytePad } from "utilities/display.ts"
// import { getMaxTopLine, type ViewportDataState } from "./Viewport.svelte"
// import { displaySettings } from "stores/displaySettings.svelte"
// import { numDisplayLines, radixSelections } from "stores/format/index.svelte"
// import { VIEWPORT_SCROLL_INCREMENT } from "stores/configuration"
// import { getSeekOffset } from "editor_components/Header/fieldsets/Seek.svelte"
// import { untrack } from "svelte"

// export type ViewportLineData = {
//   offset: string
//   fileLine: number
//   bytes: Array<ByteValue>
//   highlight: 'even' | 'odd'
// }

// export type DataFeedAttributes = {
//   lineStartIndex: number
//   lineEndIndex: number
// }

// export const byte_value_string = (value: number, radix: RadixValues) => {
//   if (value > 255)
//     throw `Value {${value}} is larger than an unsigned int (255).`
//   let str = value.toString(radix)
//   let validLen = radixBytePad(radix)
//   return str.length < validLen ? str.padStart(validLen, '0') : str
// }

// export function getOffsetDivisibleBy(
//   offset: number,
//   bytesPerRow: BytesPerRow,
//   addLineNum: number = 0
// ): number {
//   return (
//     Math.floor(offset / bytesPerRow) * bytesPerRow + bytesPerRow * addLineNum
//   )
// }
// export class ViewportDataFeedState {
//   constructor(private viewportRef: ViewportDataState) {
//   }
//   private haltDerivations = $state(false)
//   #initAttributes: DataFeedAttributes = { lineStartIndex: 0, lineEndIndex: numDisplayLines() - 1 }
//   #frozenAttributes = $state<DataFeedAttributes>(this.#initAttributes)

//   private dataFeedState = $derived.by<ViewportLineData[]>(() => {
//     if (this.viewportRef.fileOffset() < 0) return []

//     return generate_line_data(
//       this.viewportRef,
//       this.dataFeedAttributesState.lineStartIndex,
//       this.dataFeedAttributesState.lineEndIndex
//     )
//   })
//   private dataFeedAttributesState = $derived.by<DataFeedAttributes>(() => {
//     const seekOffset = getSeekOffset()
//     if (seekOffset.inputStr === '') {
//       return this.#frozenAttributes
//     }

//     const bpr = displaySettings.bytesPerRow
//     if (!seekOffset.willRequireFetch(this.viewportRef)) {
//       const minIndex = Math.min(
//         getMaxTopLine(this.viewportRef, bpr),
//         offsetToLineNum
//           (seekOffset.offset(), bpr)
//       )
//       return {
//         lineStartIndex: minIndex,
//         lineEndIndex: minIndex + (numDisplayLines() - 1)
//       }
//     }

//     const alignedFetchOffset = Math.min(
//       0,
//       getOffsetDivisibleBy(seekOffset.offset() - VIEWPORT_SCROLL_INCREMENT - bpr, bpr)
//     )

//     const alignedStartIndex = offsetToLineNum
//       (seekOffset.offset(), bpr, alignedFetchOffset)

//     return {
//       lineStartIndex: alignedStartIndex,
//       lineEndIndex: alignedStartIndex + (numDisplayLines() - 1)
//     }
//   })

//   readonly dataFeed = () => this.dataFeedState
//   readonly feedAttributes = () => this.dataFeedAttributesState

// }

// function generate_line_data(
//   viewport: ViewportDataState,
//   startIndex: number,
//   endIndex: number = startIndex + (numDisplayLines() - 1)
// ): Array<ViewportLineData> {
//   let ret: Array<ViewportLineData> = []
//   for (let i = startIndex; i <= endIndex; i++) {
//     const viewportLineOffset = i * displaySettings.bytesPerRow
//     const fileOffset = viewportLineOffset + viewport.fileOffset()

//     let bytes: Array<ByteValue> = []
//     const highlight = i % 2 === 0

//     for (let bytePos = 0; bytePos < displaySettings.bytesPerRow; bytePos++) {
//       let byteOffset = viewportLineOffset + bytePos
//       bytes.push({
//         offset: byteOffset,
//         value:
//           viewport.data()[byteOffset] !== undefined
//             ? viewport.data()[byteOffset]
//             : -1,
//         text:
//           byteOffset < viewport.length()
//             ? byte_value_string(
//               viewport.data()[byteOffset],
//               radixSelections.display
//             )
//             : '',
//       })
//     }

//     ret.push({
//       // offset: fileOffset.toString(radixSelections.address).padStart(8, '0'),
//       offset: HexByte.str(fileOffset),
//       fileLine: fileOffset / displaySettings.bytesPerRow,
//       bytes: bytes,
//       highlight: highlight ? 'even' : 'odd',
//     })
//   }
//   return ret
// }

// export function offsetToLineNum(
//   offset: number,
//   bytesPerRow: BytesPerRow,
//   viewportStartOffset: number = 0
// ): number {
//   const nearestBPRdivisibleTargetFileOffset = getOffsetDivisibleBy(
//     offset,
//     bytesPerRow
//   )
//   const nearestBPRdivisibleViewportFileOffset = getOffsetDivisibleBy(
//     viewportStartOffset,
//     bytesPerRow
//   )
//   return (
//     (nearestBPRdivisibleTargetFileOffset -
//       nearestBPRdivisibleViewportFileOffset) /
//     bytesPerRow
//   )
// }

// export interface ByteRadixDecorator {
//   str(offset: number): string
// }
// export const HexByte: ByteRadixDecorator = {
//   str: (offset: number) =>
//     offset.toString(radixSelections.address).padStart(8, '0'),
// }
// import { numDisplayLines, radixSelections } from "stores/format/index.svelte"
// import { byte_value_string, type ByteValue } from "./BinaryData"
// import { displaySettings } from "stores/displaySettings.svelte.ts"
import type { BytesPerRow, ByteValue, RadixValues } from 'ext_types'
import { radixBytePad } from 'utilities/display.ts'
import { getMaxTopLine, type ViewportDataState } from './Viewport.svelte'
import { displaySettings } from 'stores/displaySettings.svelte'
import { numDisplayLines, radixSelections } from 'stores/format/index.svelte'
import { VIEWPORT_SCROLL_INCREMENT } from 'stores/configuration'
import { getSeekOffset } from 'editor_components/Header/fieldsets/Seek.svelte'
import { untrack } from 'svelte'

export type ViewportLineData = {
  offset: string
  fileLine: number
  bytes: Array<ByteValue>
  highlight: 'even' | 'odd'
}

export type DataFeedAttributes = {
  lineStartIndex: number
  lineEndIndex: number
}

export const byte_value_string = (value: number, radix: RadixValues) => {
  if (value > 255)
    throw `Value {${value}} is larger than an unsigned int (255).`
  let str = value.toString(radix)
  let validLen = radixBytePad(radix)
  return str.length < validLen ? str.padStart(validLen, '0') : str
}

export function getOffsetDivisibleBy(
  offset: number,
  bytesPerRow: BytesPerRow,
  addLineNum: number = 0
): number {
  return (
    Math.floor(offset / bytesPerRow) * bytesPerRow + bytesPerRow * addLineNum
  )
}
export class ViewportDataFeedState {
  constructor(private viewportRef: ViewportDataState) {}
  private haltDerivations = $state(false)
  #initAttributes: DataFeedAttributes = {
    lineStartIndex: 0,
    lineEndIndex: numDisplayLines() - 1,
  }
  #frozenAttributes = $state<DataFeedAttributes>(this.#initAttributes)

  private dataFeedState = $derived.by<ViewportLineData[]>(() => {
    if (this.viewportRef.fileOffset() < 0) return []

    return generate_line_data(
      this.viewportRef,
      this.dataFeedAttributesState.lineStartIndex,
      this.dataFeedAttributesState.lineEndIndex
    )
  })
  private dataFeedAttributesState = $derived.by<DataFeedAttributes>(() => {
    const seekOffset = getSeekOffset()
    if (seekOffset.inputStr === '') {
      return this.#frozenAttributes
    }

    const bpr = displaySettings.bytesPerRow
    if (!seekOffset.willRequireFetch(this.viewportRef)) {
      const minIndex = Math.min(
        getMaxTopLine(this.viewportRef, bpr),
        offsetToLineNum(seekOffset.offset(), bpr)
      )
      return {
        lineStartIndex: minIndex,
        lineEndIndex: minIndex + (numDisplayLines() - 1),
      }
    }

    const alignedFetchOffset = Math.min(
      0,
      getOffsetDivisibleBy(
        seekOffset.offset() - VIEWPORT_SCROLL_INCREMENT - bpr,
        bpr
      )
    )

    const alignedStartIndex = offsetToLineNum(
      seekOffset.offset(),
      bpr,
      alignedFetchOffset
    )

    return {
      lineStartIndex: alignedStartIndex,
      lineEndIndex: alignedStartIndex + (numDisplayLines() - 1),
    }
  })

  readonly dataFeed = () => this.dataFeedState
  readonly feedAttributes = () => this.dataFeedAttributesState
}

function generate_line_data(
  viewport: ViewportDataState,
  startIndex: number,
  endIndex: number = startIndex + (numDisplayLines() - 1)
): Array<ViewportLineData> {
  let ret: Array<ViewportLineData> = []
  for (let i = startIndex; i <= endIndex; i++) {
    const viewportLineOffset = i * displaySettings.bytesPerRow
    const fileOffset = viewportLineOffset + viewport.fileOffset()

    let bytes: Array<ByteValue> = []
    const highlight = i % 2 === 0

    for (let bytePos = 0; bytePos < displaySettings.bytesPerRow; bytePos++) {
      let byteOffset = viewportLineOffset + bytePos
      bytes.push({
        offset: byteOffset,
        value:
          viewport.data()[byteOffset] !== undefined
            ? viewport.data()[byteOffset]
            : -1,
        text:
          byteOffset < viewport.length()
            ? byte_value_string(
                viewport.data()[byteOffset],
                radixSelections.display
              )
            : '',
      })
    }

    ret.push({
      // offset: fileOffset.toString(radixSelections.address).padStart(8, '0'),
      offset: HexByte.str(fileOffset),
      fileLine: fileOffset / displaySettings.bytesPerRow,
      bytes: bytes,
      highlight: highlight ? 'even' : 'odd',
    })
  }
  return ret
}

export function offsetToLineNum(
  offset: number,
  bytesPerRow: BytesPerRow,
  viewportStartOffset: number = 0
): number {
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

export interface ByteRadixDecorator {
  str(offset: number): string
}
export const HexByte: ByteRadixDecorator = {
  str: (offset: number) =>
    offset.toString(radixSelections.address).padStart(8, '0'),
}
