import { describe, it, expect } from 'vitest'
import {
    getSeekOffset,
    OffsetSearchType,
} from '../../src/components/Header/fieldsets/Seek.svelte.ts'
import { radixSelections } from '../../src/stores/format/index.svelte'
import { type RadixValues } from 'ext_types'
import {
    ErrorState,
} from '../../src/components/Error/Err.svelte.ts'
import { ViewportDataState } from 'editor_components/DataDisplays/CustomByteDisplay/Viewport.svelte.ts'

describe('Seek Offset State', () => {
    describe('Input Values', () => {
        const seekOffset = getSeekOffset()
        it('should determine search type by sign prefix', () => {
            ;[
                { input: '1234', expect: OffsetSearchType.ABSOLUTE },
                { input: '+1234', expect: OffsetSearchType.RELATIVE },
                { input: '-1234', expect: OffsetSearchType.RELATIVE },
            ].forEach((testCases) => {
                seekOffset.inputStr = testCases.input
                expect(seekOffset.searchType()).toBe(testCases.expect)
            })
        })
        it('should assign offset value from derived parameters', () => {
            seekOffset.inputStr = '1234'
            expect(seekOffset.offset()).toBe(parseInt('1234', radixSelections.address))
        })
        it('should properly set numeric value according to address radix', () => {
            ;[
                { radix: 16, input: 'FF', expect: parseInt('FF', 16) },
                { radix: 10, input: '100', expect: 100 },
                { radix: 8, input: '771', expect: parseInt('771', 8) },
                { radix: 2, input: '11111111', expect: parseInt('11111111', 2) },
            ].forEach((testCases) => {
                radixSelections.address = testCases.radix as RadixValues
                seekOffset.inputStr = testCases.input
                expect(seekOffset.offset()).toBe(testCases.expect)
            })
        })
        it('should set seekable state from derived parameters', () => {
            let error: ErrorState = seekOffset.getError()
            seekOffset.inputStr = ''
            expect(seekOffset.canSeek()).toBe(false)
            expect(error.errorExists()).toBe(false)

            seekOffset.offsetMaxState = 0xff
            seekOffset.inputStr = '0xFFFF'
            expect(seekOffset.canSeek()).toBe(false)
            expect(error.errorExists()).toBe(true)
        })
    })
    describe('Utility Functions', () => {
        describe('Seek Offset Fetching', () => {
            const seekOffset = getSeekOffset()
            const Viewport = new ViewportDataState('fetching')

            it("Should determine if a given offset will require server fetching of data", () => {
                Viewport.update({
                    fileOffset: (1024 * 2),
                    bytesLeft: 40000,
                    capacity: 1024,
                    data: new Uint8Array(1024).fill(0xff),
                    length: 1024,
                    viewportId: 'fetching'
                })
                seekOffset.inputStr = '0x0'
                expect(seekOffset.willRequireFetch(Viewport)).toBe(true)
                seekOffset.inputStr = '0x8000'
                expect(seekOffset.willRequireFetch(Viewport)).toBe(true)
                seekOffset.inputStr = (Viewport.fileOffset() + 256).toString(16)
                expect(seekOffset.willRequireFetch(Viewport)).toBe(false)

            })
        })
    })
})
