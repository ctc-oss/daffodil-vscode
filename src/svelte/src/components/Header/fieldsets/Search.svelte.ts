import type { SearchRequest, SearchResponse } from '../../../../../ext_types'
import {
    radixSelections,
    editorState,
} from '../../../stores/format/index.svelte.ts'
import { validateEncodingStr } from '../../../utilities/display.ts'
import { ErrorComponentType, ErrorState } from '../../Error/Err.svelte.ts'

export type IndexCriteria = {
    start: number
    end: number
    data: any[]
}
export interface QueryableData {
    input: string
    processing: boolean
    initiaited: boolean
    iterableDataFromOffset(offset: number): IndexCriteria
    clear(): void
}

class SearchQuery {
    input = $state<string>('')
    private errorState = new ErrorState(ErrorComponentType.STRING)

    private processing = $state<boolean>(false)
    private index = $state<number>(0)
    private results = $state<number[]>([])
    private overflow = $state<boolean>(false)
    private byteLength = $state<number>(0)

    private initiaited = $derived<boolean>(this.results.length > 0)
    private matchOffset = $derived.by<number>(() => {
        if (this.results.length > 0) return this.results[0]
        return -1
    })
    private searchable = $derived.by<boolean>(() => {
        if (this.processing) return false
        if (this.input.length === 0) return false
        const isEncodingValid = validateEncodingStr(
            this.input,
            editorState.encoding,
            'full'
        )
        if (isEncodingValid.errMsg !== '') {
            // set errmsg state
            this.errorState.update(isEncodingValid.errMsg)
        } else this.errorState.clear()
        return isEncodingValid.valid
    })

    constructor(public requestStrategy: (request: SearchRequest) => void) { }

    clear() {
        this.input = ''
        this.processing = false
        this.index = 0
        this.results = []
        this.overflow = false
        this.byteLength = 0
    }
    iterableDataFromOffset(offset: number): IndexCriteria {
        throw new Error('Method not implemented.')
    }
    update(response: SearchResponse, callback?: () => any) {
        if (response.results.length <= 0) {
            this.clear()
            return
        }
        this.results = response.results
        this.byteLength = response.byteLength
        this.overflow = response.overflow
        this.processing = false
        if (callback) callback()
    }

    readonly getError = () => this.errorState
    readonly currentMatchOffset = (): number => this.matchOffset
    readonly isActive = () => this.initiaited
    readonly isProcessing = () => this.processing
    readonly canSearch = () => this.searchable
    readonly hasOverflow = () => this.overflow
    readonly at = (
        searchOffset: number,
        searchLen: number,
        opts: { caseInsensitive: boolean; reverse: boolean }
    ) => {
        this.processing = true
        this.initiaited = true
        const request: SearchRequest = {
            encoding: editorState.encoding,
            searchStr: this.input,
            is_case_insensitive: opts.caseInsensitive,
            is_reverse: opts.reverse,
            length: searchLen,
            limit: 1,
            offset: searchOffset,
        }
        this.requestStrategy(request)
    }
    // DEBUGONLY
    readonly toString = (): string => {
        let ret = ''
        ret += `Input (${this.input}); Current Offset (${this.matchOffset.toString(radixSelections.address)}) Searchable (${this.searchable}); Processing (${this.processing})`
        return ret
    }
    readonly resultsStr = (): string => {
        let ret = '['
        this.results.forEach((offset) => {
            ret += `${offset.toString(radixSelections.address)}, `
        })
        return ret + ']'
    }
}

const searchQueryState = new SearchQuery(() => { })
export const getSearchQuery = () => searchQueryState
