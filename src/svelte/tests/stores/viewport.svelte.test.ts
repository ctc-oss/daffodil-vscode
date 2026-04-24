import { ViewportState } from 'editor_components/DataDisplays/CustomByteDisplay/ViewportState.svelte.ts'
import type { ViewportRefreshResponse } from 'ext_types'
import { describe, it, expect, beforeEach } from 'vitest'

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
      expect(viewport.fileOffset()).eq(expected)
      let offsetRef = viewport.fileOffset()
      offsetRef = -1
      expect(viewport.fileOffset()).eq(expected)
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
      expect(viewport.fileOffset()).toBe(expected)
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
      expect(actual.lower).eq(expected.lower)
      expect(actual.upper).eq(expected.upper)
    })
  })
})

// import { ViewportDataState } from 'editor_components/DataDisplays/CustomByteDisplay/Viewport.svelte.ts'
// // import { offsetToLineNum } from 'utilities/display'
// import { describe, it, expect, afterEach } from 'vitest'

// describe('Viewport Data State', () => {
//     const Viewport = new ViewportDataState('testvp')
//     afterEach(() => {
//         Viewport.reset()
//     })
//     describe('Updating Viewport Data', () => {
//         it('Should throw if response id != viewport id', () => {
//             expect(() => {
//                 Viewport.update({
//                     fileOffset: 0,
//                     bytesLeft: 0,
//                     capacity: 0,
//                     data: new Uint8Array(0),
//                     length: 0,
//                     viewportId: 'invalid',
//                 })
//             }).toThrow(
//                 `Response ID (invalid) does not match viewport ID (${Viewport.id()})`
//             )
//         })
//         it("Should generate a data line feed for the UI", () => {
//             Viewport.update({
//                 fileOffset: 16,
//                 bytesLeft: 10000,
//                 capacity: 1024,
//                 data: new Uint8Array(1024).fill(0xff),
//                 length: 1024,
//                 viewportId: 'testvp',
//             })
//             console.log(Viewport.dataFeed())
//             expect(Viewport.dataFeed().length).not.toBe(0)
//         })
//         describe('Utility Functions', () => {
//             // describe('Data Feed Positions', () => {
//             //     let lineTopMax = $derived.by(() => {
//             //         const maxOffset = Math.max(
//             //             0,
//             //             Viewport.length() - numDisplayLines() * displaySettings.bytesPerRow
//             //         )
//             //         const vpLineTopMax = offsetToLineNum(
//             //             maxOffset + Viewport.fileOffset(),
//             //             Viewport.fileOffset(),
//             //             displaySettings.bytesPerRow
//             //         )
//             //         return vpLineTopMax + 1
//             //     })
//             //     it("Should derive the viewport top line max", () => {
//             //         Viewport.update({
//             //             fileOffset: 16,
//             //             bytesLeft: 10000,
//             //             capacity: 1024,
//             //             data: new Uint8Array(1024).fill(0xff),
//             //             length: 1024,
//             //             viewportId: 'testvp',
//             //         })
//             //         expect(Viewport.feedLineTop()).toBe(45)
//             //     })
//             // })
//             describe('Fetch Boundary', () => {
//                 it('Should provide upper fetch boundaries of a viewport', () => {

//                     Viewport.update({
//                         fileOffset: 16,
//                         bytesLeft: 10000,
//                         capacity: 1024,
//                         data: new Uint8Array(1024).fill(0xff),
//                         length: 1024,
//                         viewportId: 'testvp',
//                     })
//                     let expected = 720
//                     expect(Viewport.boundaries()['upper']).toBe(expected)
//                 })
//                 it('Should provide lower fetch boundaries of a viewport', () => {
//                     Viewport.update({
//                         fileOffset: 1600,
//                         bytesLeft: 10000,
//                         capacity: 1024,
//                         data: new Uint8Array(1024).fill(0xff),
//                         length: 1024,
//                         viewportId: 'testvp',
//                     })
//                     let expected = 1600
//                     expect(Viewport.boundaries()['lower']).toBe(expected)
//                 })
//             })
//         })
//     })
// })
