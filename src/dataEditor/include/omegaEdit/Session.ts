import {
  ALL_EVENTS,
  CreateSessionResponse,
  EditorClient,
  EventSubscriptionRequest,
  ViewportDataResponse,
  ViewportEvent,
  ViewportEventKind,
  createViewport,
  getByteOrderMark,
  getClient,
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
  fileName: '',
  language: '',
  type: '',
  undoCount: 0,
}
export class Session {
  readonly id: string

  private metadata = SessionMetadata
  private metadataEventEmitter = new EventEmitter()
  private viewports: Map<string, Viewport> = new Map()

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
  async createViewport(
    client: EditorClient,
    offset: number,
    capacity: number,
    onDataEvent: (event: Viewport) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      createViewport(undefined, this.id, offset, capacity)
        .then((response) => {
          this.viewports.set(
            response.getViewportId(),
            new Viewport(response.getData_asU8(), capacity)
          )
          client
            .subscribeToViewportEvents(
              new EventSubscriptionRequest()
                .setId(response.getViewportId())
                .setInterest(
                  ALL_EVENTS & ~ViewportEventKind.VIEWPORT_EVT_MODIFY
                )
            )
            .on('data', async (event: ViewportEvent) => {
              onDataEvent(new Viewport(event.getData_asU8(), 1024))
            })
          resolve()
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
  info() {
    return { ...this.metadata }
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
