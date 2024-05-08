import {
  CreateSessionResponse,
  createViewport,
  getByteOrderMark,
  getContentType,
  getLanguage,
} from '@omega-edit/client'
import EventEmitter from 'events'
import { Viewport } from './Viewport'
import { IEditorComponent } from '../service/editorService'

/* OmegaEditService Implementation */
const SessionMetadata = {
  byteOrderMark: '',
  changeCount: 0,
  computedFileSize: 0,
  diskFileSize: 0,
  fileName: '',
  language: '',
  type: '',
  undoCount: 0,
}
export class Session {
  readonly id: string

  private metadata = SessionMetadata
  private metadataEventEmitter = new EventEmitter()
  // private viewports: Map<Viewport, (viewport: Viewport) => void> = new Map()
  private viewports: Viewport[] = []
  constructor(
    file: string,
    response: CreateSessionResponse,
    public onMetadataUpdate: (data: typeof SessionMetadata) => void
  ) {
    this.id = response.getSessionId()
    this.metadata.fileName = file
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
    capacity: number,
    onDataEvent: (event: Viewport) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      createViewport(undefined, this.id, offset, capacity)
        .then((response) => {
          this.viewports.push(
            new Viewport(
              response.getViewportId(),
              response.getOffset(),
              Uint8Array.from(response.getData_asU8()),
              capacity,
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
