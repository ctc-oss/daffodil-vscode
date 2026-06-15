import {
    ViewportState,
    type ViewportAttributes,
} from 'editor_components/DataDisplays/CustomByteDisplay/ViewportState.svelte.ts'
import type { ViewportRefreshResponse } from 'ext_types'
import { flushSync } from 'svelte'
import { describe, it, expect, beforeEach } from 'vitest'
import type { ReactiveLogEntry } from './utils/reactiveLogger.svelte'
import { F_ViewportStateTest } from './utils/viewportFns.svelte'
import { ViewportController } from 'editor_components/DataDisplays/CustomByteDisplay/ViewportController.svelte'

const TestId = 'testvp'
const createRefreshResponse = (fields: Partial<ViewportRefreshResponse>) => {
    let ret: ViewportRefreshResponse = {
        viewportId: TestId,
        fileOffset: 0,
        length: 0,
        bytesLeft: 0,
        data: new Uint8Array(1024).fill(0),
        capacity: 1024,
    }
    for (const field of Object.keys(fields)) {
        ret[field] = fields[field]
    }
    return ret
}

/**
 *
 * ViewportState Test Suite
 *
 */
describe('ViewportState Runes', () => {
    const viewport = new ViewportState('testvp')
    beforeEach(() => {
        viewport.reset()
    })
    describe('Public Getters', () => {
        it('should retain non-reactive values', () => {
            const expected = 100
            const resp = createRefreshResponse({ fileOffset: expected })

            viewport.update(resp)
            expect(viewport.fileOffset).toEqual(expected)

            let offsetRef = viewport.fileOffset
            offsetRef = -1

            expect(viewport.fileOffset, `vp offset ${viewport.fileOffset} !== expected ${expected}`).toEqual(expected)
            expect(offsetRef).not.toEqual(viewport.fileOffset)
        })
    })
    describe('Data Updating', () => {
        it('Should only accept updates from responses id', () => {
            expect(() =>
                viewport.update(
                    createRefreshResponse({ fileOffset: 25, viewportId: 'shouldFail' })
                )
            ).toThrow()
            const expected = 42069
            viewport.update(
                createRefreshResponse({
                    viewportId: TestId,
                    fileOffset: expected,
                })
            )
            expect(viewport.fileOffset).toBe(expected)
        })
    })
    describe('Derived Member Reactivity', () => {
        it('Should calculate fetch boundaries appropriately', () => {
            const expected = {
                lower: 16,
                upper: 720,
            }
            const resp = createRefreshResponse({
                fileOffset: 16,
                bytesLeft: 10000,
                length: 1024,
            })
            viewport.update(resp)
            const actual = viewport.boundaries()
            expect(actual.lower).toEqual(expected.lower)
            expect(actual.upper).toEqual(expected.upper)
        })
        it('Should determine validity from member runes', () => {
            let actual = viewport.valid
            expect(actual).toEqual(false)

            const resp = createRefreshResponse({
                fileOffset: 16,
                bytesLeft: 10000,
                length: 1024,
            })
            viewport.update(resp)
            expect(actual).toEqual(false)
        })
    })
})

describe("ViewportController State", () => {
    it("should allow for adding ViewportState objects to be controlled", () => {
        const Controller = new ViewportController()
        const vp = new ViewportState('controlledVP')

        Controller.add(vp)
        expect(Controller)
    })
})
