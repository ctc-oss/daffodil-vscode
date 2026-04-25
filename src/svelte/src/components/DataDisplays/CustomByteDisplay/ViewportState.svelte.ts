import type { BytesPerRow, ViewportRefreshResponse } from 'ext_types'
import { offsetToLineNum, type ViewportLineData } from './DataFeed.svelte.ts'
import { displaySettings } from 'stores/displaySettings.svelte.ts'
import { numDisplayLines } from 'stores/format/index.svelte.ts'
import type { } from 'ext_types/messages.ts'

export type ViewportFetchBoundary = {
    upper: number
    lower: number
}
export type ViewportAttributes = {
    capacity: number
    bytesLeft: number
    data: Uint8Array
    fileOffset: number
    length: number
    offsetMax: number
}
export class ViewportState { // TODO: Viewports should own a respective DisplaySettings rune.
    constructor(private id: string) {
        this.id = id
    }

    #data = $state<Uint8Array>(new Uint8Array())
    #fileOffset = $state<number>(-1)
    #length = $state<number>(-1)
    #capacity = $state<number>(-1)
    #bytesLeft = $state<number>(-1)
    #offsetMax = $state(-1)

    #valid = $derived.by(() => {
        if (this.#fileOffset < 0) return false
        if (this.#bytesLeft < 0) return false
        if (this.#length < 0) return false
        if (this.#capacity < 0) return false
        if (this.#offsetMax < 0) return false
        if (this.#data.length === 0 || this.#data[0] === undefined) return false
        if (this.id === '') return false
        return true
    })

    get viewportId() {
        return this.id
    }
    get data() {
        return this.#data
    }
    get fileOffset() {
        return this.#fileOffset
    }
    get length() {
        return this.#length
    }
    get capacity() {
        return this.#capacity
    }
    get bytesLeft() {
        return this.#bytesLeft
    }
    get offsetMax() {
        return this.#offsetMax
    }
    get valid() {
        return this.#valid
    }

    #boundaries = $derived<ViewportFetchBoundary>({
        upper: getFetchBoundary('upper', this, displaySettings.bytesPerRow),
        lower: this.#fileOffset,
    })

    boundaries() {
        return this.#boundaries
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
    if (type == 'lower') return viewport.fileOffset

    const numBytesDisplayed = numDisplayLines() * numBytesPerRow
    const boundary =
        viewport.length >= numBytesDisplayed
            ? viewport.fileOffset + viewport.length - numBytesDisplayed
            : viewport.length
    return boundary
}

export function getMaxTopLine(
    viewport: ViewportState,
    numBytesPerRow: BytesPerRow = displaySettings.bytesPerRow
) {
    const maxOffset = Math.max(
        0,
        viewport.length - numDisplayLines() * numBytesPerRow
    )
    const lineTopMax = offsetToLineNum(
        maxOffset + viewport.fileOffset,
        viewport.fileOffset
    )
    return lineTopMax + 1
}

//   it('logs exactly which members changed after state mutation', () => {
//     const model = new CounterModel();
//     const logs: ReactiveLogEntry[] = [];

//     const destroy = model.attachReactiveLogger((entry) => {
//       logs.push(entry);
//     });

//     flushSync();
//     logs.length = 0;

//     model.increment();
//     flushSync();

//     expect(logs).toEqual([
//       {
//         phase: 'cleanup',
//         changed: ['count', 'label', 'doubled', 'summary'],
//         values: {
//           count: 0,
//           label: 'counter',
//           doubled: 0,
//           summary: 'counter: 0'
//         }
//       },
//       {
//         phase: 'run',
//         changed: ['count', 'doubled', 'summary'],
//         values: {
//           count: 1,
//           label: 'counter',
//           doubled: 2,
//           summary: 'counter: 1'
//         }
//       }
//     ]);

//     destroy();
//   });
