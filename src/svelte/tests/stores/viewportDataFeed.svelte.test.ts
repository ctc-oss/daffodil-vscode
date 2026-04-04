import { HexByte, offsetToLineNum, ViewportDataFeedState } from 'editor_components/DataDisplays/CustomByteDisplay/DataFeed.svelte'
import { ViewportDataState } from 'editor_components/DataDisplays/CustomByteDisplay/Viewport.svelte.ts'
import { getSeekOffset } from 'editor_components/Header/fieldsets/Seek.svelte'
import { displaySettings } from 'stores/displaySettings.svelte'
import { radixSelections } from 'stores/format/index.svelte'
import { describe, it, expect, afterEach } from 'vitest'

describe('Viewport Data Generated Line Feed', () => {
    const Viewport = new ViewportDataState('datagen')
    const ViewportDataFeed: ViewportDataFeedState = new ViewportDataFeedState(Viewport)
    const seekOffset = getSeekOffset()
    // let attributes = ViewportDataFeed.feedAttributes()
    const dataFeed = ViewportDataFeed.dataFeed()

    afterEach(() => {
        Viewport.reset()
        // seekOffset.inputStr = ''
        // expect(attributes).toStrictEqual({
        //     lineStartIndex: 0,
        //     lineEndIndex: 19
        // })
    })

    describe('Old stores algorithm with states', () => {

        const viewportUpdates = {
            initial: {
                fileOffset: 0,
                bytesLeft: 123456,
                capacity: 1024,
                data: new Uint8Array(1024),
                length: 1024,
                viewportId: 'datagen',
            },
            midLineStart: {
                fileOffset: 0x58,
                bytesLeft: 123456,
                capacity: 1024,
                data: new Uint8Array(1024),
                length: 1024,
                viewportId: 'datagen',
            },
        }

        it('should calculate the starting line index to generate from offset 0', () => {
            Viewport.update(viewportUpdates.initial)
            expect(ViewportDataFeed.feedAttributes().lineStartIndex).toBe(0)
        })
        it('should calculate the closest starting line index for any offset', () => {
            // $inspect(seekOffset).with((type, values) => {
            //     if (type === 'update') console.trace(values)
            // })
            // $inspect(attributes).with((type, values) => {
            //     if (type === 'update') console.trace(values)
            // })
            Viewport.update(viewportUpdates.initial)

            seekOffset.inputStr = (256).toString(radixSelections.address)
            expect(ViewportDataFeed.feedAttributes().lineStartIndex).toBe(16)
            seekOffset.inputStr = (250).toString(radixSelections.address)
            expect(ViewportDataFeed.feedAttributes().lineStartIndex).toBe(15)
            seekOffset.inputStr = (279).toString(radixSelections.address)
            expect(ViewportDataFeed.feedAttributes().lineStartIndex).toBe(17)
        })

        it('should generate byte data feed aligned to the calculated line indices', () => {
            Viewport.update(viewportUpdates.initial)

            expect(dataFeed.length).not.toBe(0)
            expect(dataFeed[0].offset).toBe(HexByte.str(0))

            const lastLinesOfBytes = dataFeed[dataFeed.length - 1]
            const lastLineOffset = offsetToLineNum
                (parseInt(lastLinesOfBytes.offset, displaySettings.bytesPerRow), displaySettings.bytesPerRow, 0)

            expect(lastLineOffset).toBe(ViewportDataFeed.feedAttributes().lineEndIndex)

            seekOffset.inputStr = HexByte.str(250)


            expect(dataFeed[0].offset).not.toBe(HexByte.str(0))
            expect(attributes.lineStartIndex).toBe(15)
        })
    })
})
