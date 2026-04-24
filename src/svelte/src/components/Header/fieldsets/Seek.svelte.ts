import { ErrorComponentType, ErrorState } from '../../Error/Err.svelte.ts'
import { radixSelections } from '../../../stores/format/index.svelte.ts'
import { regexEditDataTest } from '../../../utilities/display.ts'
import type { ViewportState } from 'editor_components/DataDisplays/CustomByteDisplay/ViewportState.svelte.ts'

export enum OffsetSearchType {
  ABSOLUTE,
  RELATIVE,
}

export type SeekOffsetStrategy = (offset: number) => any

class SeekOffset {
  inputStr = $state<string>('')

  private error = $state<ErrorState>(new ErrorState(ErrorComponentType.STRING))

  // private offsetState = $state<number>(-1) // should derive from : seekOffsetInput, seekOffsetSearchType, dataFeedLineTopOffset, addressRadix
  offsetMaxState = $state<number>(-1)

  private searchTypeState = $derived.by<OffsetSearchType>(() => {
    const sign = this.inputStr.substring(0, 1)
    return sign === '+' || sign === '-'
      ? OffsetSearchType.RELATIVE
      : OffsetSearchType.ABSOLUTE
  })
  private offsetState = $derived.by<number>(() => {
    if (this.searchTypeState === OffsetSearchType.ABSOLUTE) {
      return this.inputStr.length > 0
        ? Math.max(0, parseInt(this.inputStr, radixSelections.address))
        : 0
    }
    // return Math.max(0, dataFeedLineTopOffset) + parseInt(this.inputStr, radixSelections.address)
    return parseInt(this.inputStr, radixSelections.address)
  })
  private seekableState = $derived.by<boolean>(() => {
    if (this.inputStr.length <= 0) {
      this.error.clear()
      return false
    }
    if (this.offsetState > this.offsetMaxState) {
      this.error.update('Seek offset exceeds max offset')
      return false
    }
    if (this.offsetState < 0) {
      this.error.clear()
      return false
    }
    if (!regexEditDataTest(this.inputStr, radixSelections.address)) {
      this.error.update(
        `Offset input does not match input radix (${radixSelections.address})`
      )
      return false
    }
    this.error.clear()
    return true
  })
  seekStrategy: SeekOffsetStrategy = (offset) => {}

  readonly canSeek = () => this.seekableState
  readonly offset = () => this.offsetState
  readonly searchType = () => this.searchTypeState
  readonly getError = (): ErrorState => this.error

  willRequireFetch(viewport: ViewportState) {
    const fetchContent =
      this.offsetState > viewport.fileOffset()
        ? viewport.bytesLeft() > 0
        : viewport.fileOffset() > 0
    if (!fetchContent) return false
    const boundaries = viewport.boundaries()
    const outOfBounds =
      this.offsetState < boundaries.lower || this.offsetState > boundaries.upper
    return outOfBounds
  }
}

const seekOffset = new SeekOffset()
export const getSeekOffset = () => seekOffset
