import type {
    BytesPerRow,
    ByteValue,
    RadixValues,
    ViewportRefreshResponse,
} from 'ext_types'
import {
    numDisplayLines,
    radixSelections,
} from '../../../stores/format/index.svelte.ts'
import { displaySettings } from 'stores/displaySettings.svelte.ts'
import { offsetToLineNum, type ViewportLineData } from './DataFeed.svelte.ts'
import { byte_value_string } from './oldfeed.svelte.ts'

export const VIEWPORT_CAPACITY = 1024
export type Viewport = {
    fileOffset: number
    length: number
    readonly capacity: number
    bytesLeft: number
    data: Uint8Array
}

export type ViewportFetchBoundary = {
    upper: number
    lower: number
}

export class ViewportState {
    constructor(id?: string) {
        if (id) this.#idState = id
    }

    // private viewport = $state<Viewport>({
    //   fileOffset: -1,
    //   length: -1,
    //   capacity: VIEWPORT_CAPACITY,
    //   bytesLeft: -1,
    //   data: new Uint8Array(VIEWPORT_CAPACITY)
    // })
    #idState = $state<string>('')
    #offsetMaxState = $state(-1)
    #fileOffsetState: number = $state(-1)
    #lengthState: number = $state(-1)
    #capacityState: number = $state(-1)
    #bytesLeftState: number = $state(-1)
    #dataState: Uint8Array = $state(new Uint8Array(0).fill(-1))
    #boundariesState = $derived.by<ViewportFetchBoundary>(() => {
        return {
            upper: getFetchBoundary('upper', this, displaySettings.bytesPerRow),
            lower: this.#fileOffsetState
        }
    })
    // private isFeedInitializedState = $derived.by<boolean>(() => {
    //     if (this.feedDataLines.length === 0) return false
    //     if (!this.feedDataLines[0].bytes) return false
    //     return true
    // })
    // private isFeedInitializedState = $state<boolean>(false)

    private correctedFeedStartLineState = $derived.by<number>(() => {
        if (this.dataFeed()[0].bytes.length === undefined)
            return 0

        if (displaySettings.bytesPerRow !== this.dataFeed[0].bytes.length)
            return offsetToLineNum(
                parseInt(
                    this.dataFeed[0].offset,
                    radixSelections.address),
                displaySettings.bytesPerRow,
                this.#fileOffsetState
                    
        return Math.max(0, Math.min(getMaxTopLine(this), this.feedLineTop()))
    })
    private feedLineTopState = $derived.by<number>(() => {
        // if (!this.isFeedInitialized()) return 0
        return this.correctedFeedStartLineState
        // if(this.#fileOffsetState >= 0 && this.feedLineTopState >= 0){
        //   if(this.#lengthState !== 0 /* &&  displaySettings.bytesPerRow !== */ ){
        //     return offsetToLineNum(this.#fileOffsetState, radixSelections.address, displaySettings.bytesPerRow)
        //   }
        // }
    })
    private feedDataLines = $derived.by<ViewportLineData[]>(() => {
        // Initial population of data lines
        // if (this.feedLineTopState === 0) {
        //   return this.generateDataLines(0, { numLinesDisplayed: numDisplayLines(), radix: radixSelections.display })
        // }
        const ret = this.generateDataLines(this.feedLineTop(), { numLinesDisplayed: numDisplayLines(), radix: radixSelections.display })
        // this.isFeedInitializedState = true
        return ret
    })
    // readonly isFeedInitialized = () => this.isFeedInitializedState
    readonly offsetMax = () => this.#offsetMaxState
    readonly fileOffset = () => this.#fileOffsetState
    readonly length = () => this.#lengthState
    readonly bytesLeft = () => this.#bytesLeftState
    readonly data = () => this.#dataState
    readonly capacity = () => this.#capacityState
    readonly boundaries = () => this.#boundariesState
    readonly id = () => this.#idState
    readonly feedLineTop = () => this.feedLineTopState
    readonly dataFeed = () => this.feedDataLines

    reset() {
        this.#bytesLeftState = -1
        this.#dataState = new Uint8Array(0)
        this.#fileOffsetState = -1
        this.#lengthState = -1
        this.#offsetMaxState = -1
        this.#capacityState - 1
        this.#idState = ''
    }

    update(response: ViewportRefreshResponse) {
        const { bytesLeft, capacity, data, fileOffset, length, viewportId } =
            response

        if (viewportId != this.#idState && this.#idState !== '')
            throw `Response ID (${response.viewportId}) does not match viewport ID (${this.id()})`

        this.#capacityState = capacity
        this.#bytesLeftState = bytesLeft
        this.#dataState = data
        this.#fileOffsetState = fileOffset
        this.#lengthState = length
        this.#offsetMaxState = fileOffset + bytesLeft + length
    }
    toString() {
        let ret = `Start: ${this.#fileOffsetState}; Length: ${this.#lengthState}; Capacity: ${this.#capacityState}; Bytes Remaining: ${this.#bytesLeftState}`
        return ret
    }

    protected generateDataLines(
        startLineIndex: number,
        displayOpts: {

            numLinesDisplayed: number,
            radix: RadixValues
        },
        endLineIndex?: number,): Array<ViewportLineData> {

        endLineIndex = endLineIndex !== undefined ? endLineIndex : startLineIndex + (displayOpts.numLinesDisplayed - 1)

        let ret: Array<ViewportLineData> = []
        for (let i = startLineIndex; i <= endLineIndex; i++) {
            const viewportLineOffset = i * displaySettings.bytesPerRow
            const fileOffset = viewportLineOffset + this.#fileOffsetState

            let bytes: Array<ByteValue> = []
            const highlight = i % 2 === 0

            for (let bytePos = 0; bytePos < displaySettings.bytesPerRow; bytePos++) {
                let byteOffset = viewportLineOffset + bytePos
                bytes.push({
                    offset: byteOffset,
                    value:
                        this.#dataState[byteOffset] !== undefined
                            ? this.#dataState[byteOffset]
                            : -1,
                    text:
                        byteOffset < this.#lengthState
                            ? byte_value_string(this.#dataState[byteOffset], displayOpts.radix)
                            : '',
                })
            }

            ret.push({
                offset: fileOffset.toString(radixSelections.address).padStart(8, '0'),
                fileLine: fileOffset / displaySettings.bytesPerRow,
                bytes: bytes,
                highlight: highlight ? 'even' : 'odd',
            })
        }
        return ret
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

// export function getMaxTopLine(viewport: ViewportState, numBytesPerRow: BytesPerRow = displaySettings.bytesPerRow) {
//     const maxOffset = Math.max(0, viewport.length() - numDisplayLines() * numBytesPerRow)
//     const lineTopMax = offsetToLineNum(maxOffset + viewport.fileOffset(), numBytesPerRow, viewport.fileOffset())
//     return lineTopMax + 1
// }
