import type { BytesPerRow } from 'ext_types'
import { BYTES_PER_ROW_MAX_LINE_NUM } from './configuration'

export type DisplaySettings = {
  bytesPerRow: BytesPerRow
}

class DisplaySettingsState {
  bytesPerRow = $state<BytesPerRow>(16)
  private numDisplayLinesState = $derived(
    BYTES_PER_ROW_MAX_LINE_NUM[this.bytesPerRow]
  )

  readonly numDisplayLines = () => this.numDisplayLinesState
}

export const displaySettings = new DisplaySettingsState()
// export const getDisplaySettings = () => displaySettingsState
