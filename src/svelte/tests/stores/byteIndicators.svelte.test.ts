import { describe, it, expect, beforeEach } from 'vitest'
import {
  byteIndications,
  categoryMax,
  type IndicationCategory,
} from '../../src/stores/byteIndicators.svelte.ts'

describe('Viewport Byte Data Indicator State', () => {
  const indicatorMap = byteIndications()
  const categoryA: IndicationCategory = {
    name: 'A',
    bitLength: 2,
    bitPos: 0,
    isUnique: true,
  }
  beforeEach(() => {
    indicatorMap.reset()
  })
  it('should allow registering indication categories', () => {
    indicatorMap.addCategory(categoryA)
    expect(indicatorMap.getCategory('A')).toBeDefined()
  })
  it('should throw on category registration failures', () => {
    indicatorMap.addCategory(categoryA)
    expect(() => {
      indicatorMap.addCategory({
        name: 'B',
        bitLength: 1,
        bitPos: 1,
        isUnique: true,
      })
    }).toThrow('This category bits are already in use')
    expect(() => {
      indicatorMap.addCategory(categoryA)
    }).toThrow('A category of this type is already registered')
  })
  it('should throw on category registration when all bits are used', () => {
    indicatorMap.addCategory(categoryA) // 0000 0011
    indicatorMap.addCategory({
      bitLength: 3,
      bitPos: 2,
      name: 'B',
      isUnique: true,
    }) // 0001 1111
    indicatorMap.addCategory({
      bitLength: 3,
      bitPos: 5,
      name: 'C',
      isUnique: true,
    }) // 1111 1111
    expect(() => {
      indicatorMap.addCategory({
        bitLength: 3,
        bitPos: 2,
        name: 'D',
        isUnique: true,
      })
    }).toThrow('All 8 bits are currently in use')
  })
  it('should provide a reference subarray for a given category update range', () => {
    indicatorMap.addCategory(categoryA)
    indicatorMap.update(categoryA.name, { start: 2, end: 8 })
    const refData = indicatorMap.indications()
    refData.forEach((value, i) => {
      if (i < 2 || i > 8)
        expect(value, `Indication Value @ [${i}] != 0`).toBe(0)
      else
        expect(
          value,
          `Indication Value @ [${i}] != 1\n${indicatorMap.indications().subarray(0, 16)}`
        ).toBe(1)
    })
  })
  it('should error if update value exceeds bit range', () => {
    indicatorMap.addCategory(categoryA)
    expect(() => {
      indicatorMap.update('A', { start: 2, end: 8 }, 1)
    }).not.toThrow()
    expect(() => {
      indicatorMap.update('A', { start: 2, end: 8 }, 4)
    }).toThrow("Input value exceeds category's bit range")
  })
  it('should shrink and expand an existing and unique ranges', () => {
    indicatorMap.addCategory(categoryA)
    indicatorMap.update(categoryA.name, { start: 2, end: 8 })

    indicatorMap.update(categoryA.name, { start: 4, end: 6 })
    const refData = indicatorMap.indications()
    refData.forEach((byte, i) => {
      if (i < 4 || i >= 6)
        expect(byte, `Indication Value @ [${i}] != 0`).toBe(0)
      else expect(byte, `Indication Value @ [${i}] != 1`).toBe(1)
    })
  })
  it('should retain previous byte values when other categories have set', () => {
    indicatorMap.addCategory(categoryA)
    indicatorMap.addCategory({
      bitLength: 1,
      bitPos: 3,
      isUnique: true,
      name: 'b',
    })
    indicatorMap.update('A', { start: 0, end: 16 })
    indicatorMap.update('b', { start: 2, end: 8 })
    const refData = indicatorMap.indications().subarray(0, 16)
    refData.forEach((byte, i) => {
      if (i >= 2 && i <= 8) {
        expect(
          byte,
          `Indication Value @ [${i}] != 9; Actual = ${byte.toString(2).padStart(8, '0')}`
        ).toBe(0b1001)
      } else
        expect(
          byte,
          `Indication Value @ [${i}] != 1; Actual = ${byte.toString(2).padStart(8, '0')}`
        )
    })
  })
})

describe('Indication Utilities', () => {
  describe('Category Max Value', () => {
    it('should appropriately calculate value from bits used', () => {
      const max = categoryMax({
        bitLength: 3,
        bitPos: 1,
        isUnique: true,
        name: 'a',
      })
      expect(
        max,
        `Expected 00001110; Actual: ${max.toString(2).padStart(8, '0')}`
      ).toBe(0b00001110)
    })
  })
})
