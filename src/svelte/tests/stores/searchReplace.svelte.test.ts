import { describe, it, expect, afterEach } from 'vitest'
import { type SearchResponse } from 'ext_types'
import { getSearchQuery } from '../../src/components/Header/fieldsets/Search.svelte.ts'
import { editorState } from '../../src/stores/format/index.svelte.ts'

describe('Search and Replace Data States', () => {
  const search = getSearchQuery()
  const searchResponseStub: SearchResponse = {
    byteLength: 1,
    overflow: false,
    results: [0],
  }
  const searchRequestStub = {
    searchOffset: 0,
    searchLen: search.input.length,
    opts: {
      caseInsensitive: false,
      reverse: false,
    },
  }
  afterEach(() => {
    search.clear()
  })

  describe('Search Query States', () => {
    it('Should react when updated from response', () => {
      search.update(searchResponseStub)
      expect(search.isActive()).toBe(true)
    })
    it('should react when initiating a request', () => {
      search.input = 'abc123'
      search.at(
        searchRequestStub.searchOffset,
        searchRequestStub.searchLen,
        searchRequestStub.opts
      )
      expect(search.isProcessing()).toBe(true)
      search.update(searchResponseStub)

      expect(search.isActive()).toBe(true)
      expect(search.isProcessing()).toBe(false)
    })
    it('should properly clear content when invoked', () => {
      search.clear()
    })
    it('should set `searchable` derived state', () => {
      search.clear()
      expect(search.canSearch()).toBe(false)
      search.input = 'abc123'
      expect(search.canSearch()).toBe(true)
      search.at(
        searchRequestStub.searchOffset,
        searchRequestStub.searchLen,
        searchRequestStub.opts
      )
      expect(search.canSearch()).toBe(false)
    })
    it('should retain errors for encoding string mismatches', () => {
      editorState.encoding = 'binary'
      search.input = 'abcd'
      expect(search.canSearch()).toBe(false)
      expect(search.getError().errorExists()).toBe(true)
    })
    it('should retain the offset of the first found search match result', () => {
      search.input = '123'
      let expectedOffset = 0x16
      search.update({
        byteLength: search.input.length,
        overflow: false,
        results: [expectedOffset],
      })
      expect(search.currentMatchOffset()).toBe(expectedOffset)
      search.update({
        byteLength: search.input.length,
        overflow: false,
        results: [expectedOffset, expectedOffset * 2],
      })
      expect(search.currentMatchOffset()).toBe(expectedOffset)

      search.clear()
      search.input = 'abc'

      search.update({
        byteLength: search.input.length,
        overflow: false,
        results: [0, expectedOffset],
      })
      expect(search.currentMatchOffset()).toBe(0)
    })
    it('should retain a boolean when more results exist', () => {
      search.update({ byteLength: 1, overflow: true, results: [0, 1, 2] })
      expect(search.hasOverflow()).toBe(true)
    })
  })
  describe('Search Request Strategy', () => {
    it('should be injectable', () => {
      let didSendRequest = false
      search.requestStrategy = (request) => {
        didSendRequest = true
      }
      search.at(
        searchRequestStub.searchOffset,
        searchRequestStub.searchLen,
        searchRequestStub.opts
      )
      expect(didSendRequest).toBe(true)
    })
  })
})
