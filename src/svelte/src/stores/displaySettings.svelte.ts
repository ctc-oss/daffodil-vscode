import type { BytesPerRow } from 'ext_types'
import { BYTES_PER_ROW_MAX_LINE_NUM } from './configuration'

export type DisplaySettings = {
    bytesPerRow: BytesPerRow
}

class DisplaySettingsState {
    bytesPerRow = $state<BytesPerRow>(16)
    #numDisplayLinesState = $derived(20)

    get numDisplayLines() { return this.#numDisplayLinesState }
    addDisplayLine() { this.#numDisplayLinesState += 1 }
    subDisplayLine() { this.#numDisplayLinesState -= 1 }
}

export const displaySettings = new DisplaySettingsState()
// export const getDisplaySettings = () => displaySettingsState
