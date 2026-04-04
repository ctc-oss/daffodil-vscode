import { describe, it, expect } from 'vitest'
import {
  radixSelections
} from '../../src/stores/format/index.svelte.ts'
import { type RadixValues } from '../../../ext_types/formattypes.ts'

describe('Formatting States', () => {
  describe('Address Radix', () => {
    it('should only accept a radix value type', () => {
      const radixes: RadixValues[] = [2, 8, 10, 16]
      radixes.forEach((radix) => {
        radixSelections.address = radix
        expect(radixSelections.address).toBe(radix)
      })
    })
  })
})
