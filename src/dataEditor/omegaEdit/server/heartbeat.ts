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
  private readonly msInterval = 1000
  private heartbeat: IServerHeartbeat = InitialHeartbeat
  private retrieveInterval: NodeJS.Timeout
  private constructor(getSessionIds: () => string[]) {
    this.retrieveInterval = setInterval(() => {
      getServerHeartbeat(getSessionIds(), 1000)
    }, this.msInterval)
  }
  static Start(getSessionIds: () => string[]) {
    if (ActiveHeartbeat)
      throw 'Server heartbeat is already active. Use `onReceive(...)` to do something with it'
    ActiveHeartbeat = new Heartbeat(getSessionIds)
  }
  static OnReceive(listener: (heartbeat: IServerHeartbeat) => any) {
    Receivers.push(listener)
  }
}
