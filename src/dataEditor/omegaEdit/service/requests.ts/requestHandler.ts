import {
  edit,
  getCounts,
  IServerHeartbeat,
  modifyViewport,
  searchSession,
} from '@omega-edit/client'
import { FilePath } from '../..'
import { SessionIdType } from '../session'
import { ViewportCreateHandler } from './viewport'
import { MessageCommand } from '../../../../svelte/src/utilities/message'
import { EditByteModes } from '../../../../svelte/src/stores/configuration'

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
const ViewportSeekHandler: (
  id: string,
  offset: number,
  bytesPerRow: number
) => Promise<void> = (id: string, offset: number, bytesPerRow: number) => {
  return new Promise((res, rej) => {
    const startOffset = Math.max(0, offset - (offset % bytesPerRow))
    modifyViewport(id, startOffset, 1024)
      .then((_) => {
        res()
      })
      .catch((err) => rej(err))
  })
}
function encodedStrToData(
  selectionEdits: string,
  selectionEncoding?: BufferEncoding
): Buffer {
  let selectionByteData: Buffer
  switch (selectionEncoding) {
    case 'hex':
      selectionByteData = Buffer.alloc(selectionEdits.length / 2)
      for (let i = 0; i < selectionEdits.length; i += 2) {
        selectionByteData[i / 2] = parseInt(selectionEdits.slice(i, i + 2), 16)
      }
      return selectionByteData
    case 'binary':
      selectionByteData = Buffer.alloc(selectionEdits.length / 8)
      for (let i = 0; i < selectionEdits.length; i += 8) {
        selectionByteData[i / 8] = parseInt(selectionEdits.slice(i, i + 8), 2)
      }
      return selectionByteData
    default:
      return Buffer.from(selectionEdits, selectionEncoding)
  }
}
type DataSearchRequest = {
  data: string
  encoding: BufferEncoding
  offset?: number
  length?: number
  caseInsensitive?: boolean
  isReverse?: boolean
  limit?: number
}
const ViewportSearchHandler: (
  id: string,
  request: DataSearchRequest
) => Promise<any> = (id: string, request: DataSearchRequest) => {
  return new Promise(async (res, rej) => {
    const searchDataBytes = encodedStrToData(request.data, request.encoding)
    const results = await searchSession(
      id,
      request.data,
      request.caseInsensitive,
      request.isReverse,
      request.offset,
      request.length,
      request.limit
    )
    let overflow = request.limit ? results.length > request.limit : false

    if (overflow) results.pop()

    results.length === 0
      ? rej(`No matches found for ${request.data}`)
      : res({
          command: MessageCommand.searchResults,
          data: {
            searchResults: results,
            searchDataBytesLength: searchDataBytes.length,
            overflow: overflow,
          },
        })
  })
}

const ApplyChanges = (
  sessionId: string,
  offset: number,
  data: { original: Uint8Array; edited: Uint8Array }
): Promise<void> => {
  return new Promise(async (res, rej) => {
    await edit(sessionId, offset, data.original, data.edited)
    res()
  })
}
export type DataFormatParameters = {
  editMode: EditByteModes
  edits: string
  viewportType: 'logical' | 'physical'
  encoding?: BufferEncoding
}
const formatSelection = (parameters: DataFormatParameters) => {
  const { editMode, edits, viewportType, encoding } = parameters
  let selectionByteData: Buffer
  let selectionByteDisplay: string
  if (editMode === EditByteModes.Multiple) {
    selectionByteData = encodedStrToData(edits, encoding)
    selectionByteDisplay = dataToEncodedStr(selectionByteData, encoding)
  } else {
    selectionByteData =
      viewportType === 'logical'
        ? encodedStrToData(edits, 'latin1')
        : Buffer.from([parseInt(edits, message.data.radix)])

    selectionByteDisplay =
      message.data.viewport === 'logical'
        ? message.data.editedContent
        : dataToRadixStr(selectionByteData, message.data.radix)
  }

  return [selectionByteData, selectionByteDisplay]
}
const FormatEditedData = (parameters: DataFormatParameters) => {
  return new Promise((res, rej) => {
    const [selectionData, selectionDisplay] = fillRequestData(parameters)
  })
}
const RequestCommandMap = {
  getServerHeartbeat: ServerHeartbeatHandler,
  getFileInfo: FileInfoHandler,
  viewportSeekTo: ViewportSeekHandler,
  viewportCreate: ViewportCreateHandler,
  viewportSearch: ViewportSearchHandler,
  applyChanges: ApplyChanges,
}
export class ServiceRequestHandler {
  private constructor() {}
  static processRequest<C extends keyof typeof RequestCommandMap>(
    command: C
  ): (typeof RequestCommandMap)[C] {
    return RequestCommandMap[command]
  }
}
