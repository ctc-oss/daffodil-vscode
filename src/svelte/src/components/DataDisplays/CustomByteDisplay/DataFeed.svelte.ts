import type { ByteValue, RadixValues } from 'ext_types'
import { ViewportState } from './ViewportState.svelte.ts'
import { displaySettings } from 'stores/displaySettings.svelte.ts'
// import { ThemeIcon } from 'vscode'
import { numDisplayLines, radixSelections } from 'stores/format/index.svelte.ts'
import { radixBytePad } from 'utilities/display.ts'
// import { byte_value_string } from './BinaryData.ts'
// import { displaySettings } from "stores/displaySettings.svelte.ts";

export type ViewportLineData = {
    offset: string
    fileLine: number
    bytes: Array<ByteValue>
    highlight: 'even' | 'odd'
}

export class ViewportDataFeed {
    constructor(private viewportRef: ViewportState) {
    }

    // #feedLineStartIndex = $derived.by<number>(() => {
    //     if (!this.viewportRef.valid) return 0
    //     const viewportData = this.viewportRef.data

    //     const bytesPerRow = displaySettings.bytesPerRow
    //     const addrRadix = radixSelections.address
    //     // if (bytesPerRow !== this.#dataFeed[0].bytes.length) {
    //     const firstByteOffset = this.#dataFeed[0].bytes[0].offset

    //     return offsetToLineNum(firstByteOffset, bytesPerRow)
    //     // }
    // })



    // #feedLineStartIndex = $derived.by<number>(() => {
    // return if(displaySettings.bytesPerRow !== this.#dataFeed)
    // if (displaySettings.bytesPerRow !== this.dataFeed[0].bytes.length)
    // return offsetToLineNum(parseInt(this.dataFeed[0].offset, radixSelections.address), displaySettings.bytesPerRow, this.#fileOffsetState)
    // return Math.max(0, Math.min(getMaxTopLine(this), this.feedLineTop()))
    // })
    #dataFeed = $derived.by<ViewportLineData[]>(() => {
        const sourceOffset = offsetToLineNum(this.viewportRef.fileOffset)

        const ret = this.generateFeed(sourceOffset, numDisplayLines())
        return ret
        // let line: number[] = []
        // let currentLineIndex = 0
        // const dataRef = this.viewportRef.data()
        // line = Array.from(dataRef)
        // dataRef.forEach((byteValue, byteIndex) => {
        //     for (let i = 0; i < displaySettings.bytesPerRow; i++) {
        //         line.push(byteValue)
        //     }
        //     currentLineIndex += 1
        //     ret.push({ bytes: line })
        // })
        // return ret
    })

    feed() {
        return this.#dataFeed
    }

    protected generateFeed(startLineIndex: number, rowCount: number, endLineIndex?: number) {
        const bytesPerRow = displaySettings.bytesPerRow
        const viewportData = this.viewportRef.data

        endLineIndex = endLineIndex === undefined ? startLineIndex + (rowCount - 1) : endLineIndex
        let ret: ViewportLineData[] = []

        for (let i = startLineIndex; i <= endLineIndex!; i++) {
            const sourceLineOffset = i * bytesPerRow
            const sourceByteOffset = sourceLineOffset * startLineIndex

            let bytes: Array<ByteValue> = []
            const rowHighlight = i % 2 === 0

            for (let byteRowPos = 0; byteRowPos < bytesPerRow; byteRowPos++) {
                let byteOffset = sourceLineOffset + byteRowPos
                bytes.push({
                    offset: byteOffset,
                    value: viewportData[byteOffset] !== undefined ? viewportData[byteOffset] : -1,
                    text: byteOffset < this.viewportRef.length ? byte_value_string(viewportData[byteOffset], radixSelections.display) : ''
                })
            }
            ret.push({
                bytes,
                offset: sourceByteOffset.toString(radixSelections.address).padStart(8, '0'),
                highlight: rowHighlight ? 'even' : 'odd',
                fileLine: sourceByteOffset / bytesPerRow
            })
        }
        return ret
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
export const byte_value_string = (value: number, radix: RadixValues) => {
    if (value > 255)
        throw `Value {${value}} is larger than an unsigned int (255).`
    let str = value.toString(radix)
    let validLen = radixBytePad(radix)
    return str.length < validLen ? str.padStart(validLen, '0') : str
}
function correctLineIndex(getOffset: () => number) {

}
