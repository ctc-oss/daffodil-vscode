import {
    getOffsetDivisibleBy,
    offsetToLineNum,
    ViewportDataFeed,
    byte_value_string
} from 'editor_components/DataDisplays/CustomByteDisplay/DataFeed.svelte.ts'
import { ViewportState } from 'editor_components/DataDisplays/CustomByteDisplay/ViewportState.svelte.ts'
import { createRefreshResponse } from './utils/viewportFns.svelte'
import { describe, it, expect } from 'vitest'
import { displaySettings } from 'stores/displaySettings.svelte'
import { radixSelections } from 'stores/format/index.svelte'
// import { viewport } from "stores/index";

describe('Data Feed', () => {
    const viewport = new ViewportState('feedtest')
    const dataFeed = new ViewportDataFeed(viewport)

    describe("Reactivity of reference data", () => {
        it('should react to reference data updates', () => {
            let bytes = new Uint8Array(1024).fill(0x00)
            viewport.update(
                createRefreshResponse({
                    data: bytes,
                    length: 1024,
                    capacity: 1024,
                    bytesLeft: 0,
                    fileOffset: 0,
                    viewportId: 'feedtest',
                })
            )
            expect(dataFeed.dataFeed).not.toBeUndefined()
            expect(dataFeed.dataFeed.length).eq(displaySettings.numDisplayLines)

            bytes = bytes.map((value, i) => { return value ^= (i + value) / bytes.length - i })
            viewport.update(
                createRefreshResponse({
                    data: bytes,
                    length: 1024,
                    capacity: 1024,
                    bytesLeft: 0,
                    fileOffset: 0,
                    viewportId: 'feedtest',
                })
            )

            viewport.data.subarray(0, displaySettings.bytesPerRow).forEach((value, i) => {
                expect(value).toEqual(bytes[i])
                const feedRow = dataFeed.dataFeed[0]
                expect(feedRow.bytes[i]).toEqual({
                    offset: viewport.fileOffset + i,
                    text: byte_value_string(viewport.data[i], radixSelections.display),
                    value: viewport.data[i]
                })
                expect(feedRow.bytes[i])
            })
        })
    })
})

describe('Feed Utility Functions', () => {
    describe('getOffsetDivisibleBy', () => {
        it('Shouldl accurately calculate the nearest starting offset of a feed line', () => {
            displaySettings.bytesPerRow = 16

            const actual = getOffsetDivisibleBy(17)
            expect(actual).eq(16)
        })
        it('Should be reactive to display setting changes', () => {
            displaySettings.bytesPerRow = 16

            let actual = getOffsetDivisibleBy(17)
            expect(actual).eq(16)

            displaySettings.bytesPerRow = 8
            actual = getOffsetDivisibleBy(10)
            expect(actual).eq(8)
        })
    })
    describe('offsetToLineNum', () => {
        it('should accurately calculate the line index of a viewport feed', () => {
            displaySettings.bytesPerRow = 16

            let actual = offsetToLineNum(17)
            expect(actual).eq(1)

            displaySettings.bytesPerRow = 8
            actual = offsetToLineNum(17)
            expect(actual).eq(2)
        })
    })
})
