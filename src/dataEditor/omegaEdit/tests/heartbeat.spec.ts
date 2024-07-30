// import assert from 'assert'
import { describe } from 'mocha'

// class Heartbeat {
//   public intervalId: NodeJS.Timeout | undefined
//   public timeInit: number = -1
//   public timeLastRan: number = -1
//   public executions = 0
//   constructor(
//     public retrievalFn: () => void,
//     public timeMs: number,
//     testOpts: { runFn: boolean } = { runFn: false }
//   ) {
//     this.timeInit = Date.now()
//     this.intervalId = setInterval(() => {
//       console.log(`Running ${this.executions++}`)
//       this.timeLastRan = Date.now()
//       if (testOpts.runFn) this.retrievalFn()
//       clearInterval(this.intervalId)
//     }, timeMs)
//   }
// }
class Heartbeat {
  constructor(
    public ping: (ids: string[]) => Promise<any>,
    public interval: number
  ) {}
}
function mockGetServerHB(ids: string[]): Promise<{}> {
  return new Promise((res) => {
    setTimeout(() => {
      res({
        time: Date.now(),
      })
    }, 100)
  })
}
function withinTimeInterval(
  int1: number,
  int2: number,
  interval: number
): boolean {
  // const ts1 = int1.toString()
  // const ts2 = int2.toString()
  // const t1 = ts1.substring(ts1.length - 4)
  // const t2 = ts2.substring(ts2.length - 4)
  // console.log(ts1, ts2)
  // return Math.abs(parseInt(t1) - parseInt(t2)) <= interval
  return Math.abs(int1 - int2) <= interval
}
// const ResolvingPromise = new Promise<void>((res) => {
//   res()
// })

describe('Heartbeat Object Behavior', () => {
  it('Should be contructed w/ a ping fn and interval', (done) => {
    const time = Date.now()
    const h = new Heartbeat(mockGetServerHB, 100)
    let hbt = time
    h.ping([]).then((t) => {
      hbt = t.time
      console.log(hbt, time, hbt - time)
      withinTimeInterval(hbt, time, 105)
        ? done()
        : done('hbt t out of interval')
    })
  })
  it('Should register the time it was initiated', () => {
    // const startTime = Date.now()
    // const hb = new Heartbeat(async () => {
    //   return ResolvingPromise
    // }, 50)
    // assert.notEqual(hb.timeInit, -1)
    // assert(withinTimeInterval(startTime, hb.timeInit, 50))
  })
  it('Should have an initiator and receiver', () => {
    // const hb = new Heartbeat(async () => {}, 50)
  })
})
