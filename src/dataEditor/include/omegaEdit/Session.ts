import {
  CreateSessionResponse,
  createViewport,
  getByteOrderMark,
  getComputedFileSize,
  getContentType,
  getLanguage,
} from '@omega-edit/client'
import EventEmitter from 'events'
import { Viewport } from './Viewport'

/* OmegaEditService Implementation */
const SessionMetadata = {
  byteOrderMark: '',
  changeCount: 0,
  computedFileSize: 0,
  diskFileSize: 0,
  language: '',
  type: '',
  undoCount: 0,
}
type SessionMetadataNotification = {
  id: ''
  data: typeof SessionMetadata
}
export class Session {
  readonly id: string

  private metadata = SessionMetadata
  private viewports: Viewport[] = []

  constructor(
    response: CreateSessionResponse,
    public onMetadataUpdate: (data: typeof SessionMetadata) => void
  ) {
    this.id = response.getSessionId()
    if (response.hasFileSize()) {
      this.metadata.diskFileSize = this.metadata.computedFileSize =
        response.getFileSize()!
    }
    this.populateAsyncMetadata().then(() => {
      this.onMetadataUpdate(this.metadata)
    })
  }

  info() {
    return { ...this.metadata }
  }
  getViewports() {
    return this.viewports
  }

  async createViewport(
    offset: number,
    onDataEvent: (event: Viewport) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      createViewport(undefined, this.id, offset, Viewport.Capacity)
        .then((response) => {
          this.viewports.push(
            new Viewport(
              response.getViewportId(),
              response.getOffset(),
              Uint8Array.from(response.getData_asU8()),
              onDataEvent
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
    this.metadata.computedFileSize = await getComputedFileSize(this.id)
    const contentTypeResponse = await getContentType(
      this.id,
      0,
      Math.min(1024, this.metadata.computedFileSize)
    )
    this.metadata.type = contentTypeResponse.getContentType()

    const byteOrderMarkResponse = await getByteOrderMark(this.id, 0)
    this.metadata.byteOrderMark = byteOrderMarkResponse.getByteOrderMark()

    const languageResponse = await getLanguage(
      this.id,
      0,
      Math.min(1024, this.metadata.computedFileSize),
      this.metadata.byteOrderMark
    )
    this.metadata.language = languageResponse.getLanguage()
  }
}
