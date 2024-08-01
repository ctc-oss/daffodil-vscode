import { getServerHeartbeat, IServerHeartbeat } from '@omega-edit/client'
const InitialHeartbeat: IServerHeartbeat = {
  latency: 0,
  sessionCount: 0,
  serverTimestamp: 0,
  serverUptime: 0,
  serverCpuCount: 0,
  serverCpuLoadAverage: 0,
  serverMaxMemory: 0,
  serverCommittedMemory: 0,
  serverUsedMemory: 0,
}
type HeartbeatCallback = (heartbeat: IServerHeartbeat) => any
let ActiveHeartbeat: Heartbeat | undefined
const Receivers: HeartbeatCallback[] = []

export class Heartbeat {
  private running: boolean = false
  private intervalId: NodeJS.Timeout | undefined = undefined
  private lastHeartbeat: IServerHeartbeat = InitialHeartbeat

  constructor(readonly ping: (ids: string[]) => Promise<IServerHeartbeat>) {}
  start(getArgs: () => string[]) {
    this.intervalId = setInterval(async () => {
      this.lastHeartbeat = await this.ping(getArgs())
      this.onUpdate(this.lastHeartbeat)
    }, 1000)
  }
  onUpdate: (hb: IServerHeartbeat) => any = () => {}
  getLast() {
    return this.lastHeartbeat
  }
  stop() {
    clearInterval(this.intervalId)
  }
}
