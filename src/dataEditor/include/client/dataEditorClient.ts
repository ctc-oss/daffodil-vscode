import { IHeartbeatReceiver } from '@omega-edit/client'
import {
  HeartbeatInfo,
  HeartbeatProcessor,
} from '../server/heartbeat/HeartBeatInfo'
import { ServiceHeartbeat } from '../server/Server'
import { IEditService } from '../service/editorService'
class TestProcessor implements IHeartbeatReceiver {
  constructor(
    readonly id: string,
    public process: (heartbeat: HeartbeatInfo) => void
  ) {}
}
export abstract class DataEditor {
  protected abstract fileToEdit: string
  protected editService: IEditService | undefined = undefined
  constructor() {}
  async initialize(service: IEditService) {
    await this.getFile()
    this.editService = service
    service.setup(this.fileToEdit)
    // await this.setupService()
  }
  protected abstract getFile(): Promise<void>
  // protected abstract setupService(): Promise<void>
}
export interface DataEditorUI {
  show(): Promise<void>
}
