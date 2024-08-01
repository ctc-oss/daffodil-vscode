import { getCounts, IServerHeartbeat } from '@omega-edit/client'
import { FilePath } from '../..'
import { SessionIdType } from '../session'
import { ViewportCreateHandler } from './viewport'

type CommandResponse<Args, ResponseType> = (
  args?: Args
) => Promise<ResponseType>

interface ServiceRequest {
  readonly command: string
}

const ServerHeartbeatHandler = (hb: IServerHeartbeat) => {}

type FileInfo = {
  name: string
  computedFileSize: number
  changeCount: number
  undoCount: number
}

const FileInfoHandler = (sessionId: SessionIdType, file: FilePath) => {
  return new Promise(async (res, rej) => {
    const count = await getCounts(sessionId, [
      1, //CountKind.COUNT_COMPUTED_FILE_SIZE,
      7, //CountKind.COUNT_CHANGE_TRANSACTIONS,
      8, //CountKind.COUNT_UNDO_TRANSACTIONS,
    ])
    let data: FileInfo = {
      name: file ? file.fullPath() : 'No file',
      computedFileSize: 0,
      changeCount: 0,
      undoCount: 0,
    }
    count.forEach((count) => {
      switch (count.getKind()) {
        case 1: //CountKind.COUNT_COMPUTED_FILE_SIZE:
          data.computedFileSize = count.getCount()
          break
        case 7: //CountKind.COUNT_CHANGE_TRANSACTIONS:
          data.changeCount = count.getCount()
          break
        case 8: //CountKind.COUNT_UNDO_TRANSACTIONS:
          data.undoCount = count.getCount()
          break
      }
    })
    res({ command: 3, data: data })
  })
}
const ViewportSeekHandler: (offset: number) => Promise<{ data: Uint8Array }> = (
  offset: number
) => {
  return new Promise((res, rej) => {
    res({
      data: new Uint8Array(16),
    })
  })
}

const RequestCommandMap = {
  getServerHeartbeat: ServerHeartbeatHandler,
  getFileInfo: FileInfoHandler,
  viewportSeekTo: ViewportSeekHandler,
  viewportCreate: ViewportCreateHandler,
}
type CommandResponseType<T> = T extends Promise<infer R> ? T : never
type CommandKey<K> = K extends keyof typeof RequestCommandMap ? K : never
type ResponseType<C> =
  C extends CommandKey<infer K> ? (typeof RequestCommandMap)[C] : never

export class ServiceRequestHandler {
  private constructor() {}
  static getHandle<C extends keyof typeof RequestCommandMap>(
    command: C
  ): (typeof RequestCommandMap)[C] {
    return RequestCommandMap[command]
  }
}
