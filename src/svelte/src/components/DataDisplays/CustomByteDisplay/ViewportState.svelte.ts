import type { BytesPerRow, ViewportRefreshResponse } from "ext_types"
import { type ViewportLineData } from "./DataFeed.svelte.ts"
import { displaySettings } from "svelte/src/stores/displaySettings.svelte"
import { numDisplayLines } from "svelte/src/stores/format/index.svelte.ts"
import type { } from "ext_types/messages.ts"

export type ViewportFetchBoundary = {
    upper: number,
    lower: number
}

export class ViewportState {
    #id = $state<string>('')
    #data = $state<Uint8Array>(new Uint8Array)
    #fileOffset = $state<number>(-1)
    #length = $state<number>(-1)
    #capacity = $state<number>(-1)
    #bytesRemaining = $state<number>(-1)

    id() { return this.#id }
    data() { return this.#data }
    fileOffset() { return this.#fileOffset }
    length() { return this.#length }
    capacity() { return this.#capacity }
    bytesRemaining() { return this.#bytesRemaining }

    #boundaries = $derived.by<ViewportFetchBoundary>(() => {
        return {
            upper: getFetchBoundary('upper', this, displaySettings.bytesPerRow),
            lower: this.#fileOffset
        }
    })
    // update(response: Partial<ViewportRefreshResponse>) {
    update(offset: number) {
        this.#fileOffset = offset
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
