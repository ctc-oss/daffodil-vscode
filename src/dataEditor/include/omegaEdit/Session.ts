import {
  CreateSessionResponse,
  createViewport,
  getByteOrderMark,
  getComputedFileSize,
  getContentType,
  getLanguage,
} from '@omega-edit/client'
import { Viewport } from './Viewport'

/* OmegaEditService Implementation */
export type SessionMetadata = {
  id: string
  byteOrderMark: string
  changeCount: number
  computedFileSize: number
  diskFileSize: number
  language: string
  type: string
  undoCount: number
}
const SessionMetadata: SessionMetadata = {
  id: '',
  byteOrderMark: '',
  changeCount: 0,
  computedFileSize: 0,
  diskFileSize: 0,
  language: '',
  type: '',
  undoCount: 0,
}

export class Session {
  private metadata = SessionMetadata
  private viewports: Viewport[] = []
  static async FromResponse(
    response: CreateSessionResponse,
    onMetadataUpdate: (event: typeof SessionMetadata) => void
  ): Promise<Session> {
    return new Promise((resolve, reject) => {
      let ret = new Session(onMetadataUpdate)
      ret.metadata.id = response.getSessionId()
      ret.metadata.diskFileSize = ret.metadata.computedFileSize =
        response.hasFileSize() ? response.getFileSize()! : 0
      ret.populateAsyncMetadata()
      resolve(ret)
    })
  }
  private constructor(
    public onMetadataUpdate: (event: typeof SessionMetadata) => void
  ) {}

  info() {
    return { ...this.metadata }
  }
  getViewports() {
    return this.viewports
  }

  async createViewport(
    offset: number,
    onDataUpdate: (event: Viewport) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      createViewport(undefined, this.metadata.id, offset, Viewport.Capacity)
        .then((response) => {
          this.viewports.push(
            new Viewport(
              response.getViewportId(),
              response.getOffset(),
              Uint8Array.from(response.getData_asU8()),
              onDataUpdate
            )
          )
          resolve()
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  private async populateAsyncMetadata() {
    this.metadata.computedFileSize = await getComputedFileSize(this.metadata.id)
    const contentTypeResponse = await getContentType(
      this.metadata.id,
      0,
      Math.min(1024, this.metadata.computedFileSize)
    )
    this.metadata.type = contentTypeResponse.getContentType()

    const byteOrderMarkResponse = await getByteOrderMark(this.metadata.id, 0)
    this.metadata.byteOrderMark = byteOrderMarkResponse.getByteOrderMark()

    const languageResponse = await getLanguage(
      this.metadata.id,
      0,
      Math.min(1024, this.metadata.computedFileSize),
      this.metadata.byteOrderMark
    )
    this.metadata.language = languageResponse.getLanguage()
    this.onMetadataUpdate(this.metadata)
  }
}
