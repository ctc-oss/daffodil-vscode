import { IHeartbeatReceiver } from '@omega-edit/client'
import {
  HeartbeatInfo,
  HeartbeatProcessor,
} from '../server/heartbeat/HeartBeatInfo'
import { ServiceHeartbeat } from '../server/Server'
class TestProcessor implements IHeartbeatReceiver {
  constructor(
    readonly id: string,
    public process: (heartbeat: HeartbeatInfo) => void
  ) {}
}
export abstract class DataEditor {
  protected abstract fileToEdit: string
  constructor() {}
  abstract initialize(): any
}
