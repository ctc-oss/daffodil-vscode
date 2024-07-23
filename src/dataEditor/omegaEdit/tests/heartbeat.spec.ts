import assert from 'assert'
import { describe } from 'mocha'

class Heartbeat {
  public intervalId: NodeJS.Timeout | undefined
  public timeInit: number = -1
  public timeLastRan: number = -1
  public executions = 0
  constructor(
    public retrievalFn: () => void,
    public timeMs: number,
    testOpts: { runFn: boolean } = { runFn: false }
  ) {
    this.timeInit = Date.now()
    this.intervalId = setInterval(() => {
      console.log(`Running ${this.executions++}`)
      this.timeLastRan = Date.now()
      if (testOpts.runFn) this.retrievalFn()
      clearInterval(this.intervalId)
    }, timeMs)
  }
}

function withinTimeInterval(
  int1: number,
  int2: number,
  interval: number
): boolean {
  return Math.abs(int1 - int2) <= interval
}
const ResolvingPromise = new Promise<void>((res) => {
  res()
})

describe('Heartbeat Object Behavior', () => {
  it('Should register the time it was initiated', () => {
    const startTime = Date.now()
    const hb = new Heartbeat(async () => {
      return ResolvingPromise
    }, 50)
    assert.notEqual(hb.timeInit, -1)
    assert(withinTimeInterval(startTime, hb.timeInit, 50))
  })
  it('Should perform some heartbeat action on an interval', () => {
    // const hb = new Heartbeat(async () => {}, 50)
  })
})
