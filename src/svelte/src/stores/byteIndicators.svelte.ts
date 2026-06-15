export type IndicationCategory = {
  name: string
  bitPos: number
  bitLength: number
  isUnique: boolean
}
export type Range = {
  start: number
  end: number
}
export interface IndicationRange {
  category: IndicationCategory
  range: Range
  data: Uint8Array
}
export type SetType = 'set' | 'unset' | 'toggle'

class ByteIndicators {
  private indicatorMap = $state<Uint8Array>(new Uint8Array())
  private categories = $state(new Map<string, IndicationCategory>())
  private currentRanges = $state<IndicationRange[]>([])

  private bitsUsed: number = 0

  constructor(capacity: number, ...categories: IndicationCategory[]) {
    this.indicatorMap = new Uint8Array(capacity).fill(0)
  }

  addCategory(category: IndicationCategory) {
    if (this.categories.get(category.name) !== undefined)
      throw 'A category of this type is already registered'
    if (this.bitsUsed === 0xff) throw 'All 8 bits are currently in use'

    let useMask = 0
    for (let i = 0; i < category.bitLength; i++) {
      useMask |= 1 << (category.bitPos + i)
    }

    const conflictUseMask = this.bitsUsed & useMask
    if (conflictUseMask !== 0) throw 'This category bits are already in use'

    this.categories.set(category.name, category)
    this.bitsUsed |= useMask
  }

  reset() {
    this.indicatorMap?.fill(0)
    this.categories = new Map<string, IndicationCategory>()
    this.bitsUsed = 0
  }

  getCategory(name: string) {
    return this.categories.get(name)
  }

  update(name: string, range: Range, value: number = 1) {
    const category = this.categories.get(name)
    if (!category) throw 'Category is not registered'
    if (value < 0 || value > categoryMax(category))
      throw "Input value exceeds category's bit range"
    validateRangeOffsets(range)

    const existingRange = this.currentRanges.find((r) => {
      // Found and mutually exclusive
      if (r.category.name === name) {
        if (r.category.isUnique) {
          clearRange(r)
          r.range = range
          r.data = this.indicatorMap.subarray(r.range.start, r.range.end)
          return r
        }
        if (doRangesOverlap(r.range, range)) {
          clearRange(r)
          r.range.start = Math.min(r.range.start, range.start)
          r.range.end = Math.max(r.range.end, range.end)
          r.data = this.indicatorMap.subarray(r.range.start, r.range.end)
          return r
        }
      }
      return undefined
    })

    const indicationRange =
      existingRange !== undefined
        ? existingRange
        : {
            category,
            range,
            data: this.indicatorMap?.subarray(range.start, range.end + 1),
          }
    this.currentRanges.push(indicationRange)
    setIndiciationRange(indicationRange, value)
  }

  readonly indications = (): Uint8Array => this.indicatorMap
}

export function categoryMax(category: IndicationCategory) {
  const bitEnd = category.bitPos + category.bitLength
  let ret = 0
  for (let i = category.bitPos; i < bitEnd; i++) ret |= 1 << i
  return ret
}

function clearRange(range: IndicationRange) {
  range.data.forEach((byte, i) => {
    range.data[i] = byte &= ~categoryMax(range.category)
  })
}
function setIndiciationRange(
  range: IndicationRange,
  value: number,
  type: SetType = 'set'
) {
  range.data.forEach((byte, i) => {
    switch (type) {
      case 'set':
        range.data[i] = byte | (value << range.category.bitPos)
        break
      case 'unset':
        break
      case 'toggle':
        break
    }
  })
}
function doRangesOverlap(...ranges: Range[]) {
  if (ranges.length < 2) return false

  const sorted = ranges.sort((r1, r2) => r1.start - r2.start)

  let previous: Range = sorted[0]
  let current: Range

  for (let i = 1; i < sorted.length; i++) {
    current = sorted[i]
    if (current.start <= previous.end) return true
    if (current.end > previous.end) return true
  }
  return false
}
function validateRangeOffsets(range: Range) {
  if (range.start > range.end) {
    const tmpStart = range.start
    range.start = range.end
    range.end = range.start
  }
}
const IndicatorMap = new ByteIndicators(1024)
export const byteIndications = (): ByteIndicators => IndicatorMap
