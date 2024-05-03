import {
  createSession,
  getContentType,
  getByteOrderMark,
  getLanguage,
  CreateSessionResponse,
} from '@omega-edit/client'

export interface IEditService {
  set(editingFile: string): any
}

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
  constructor(response: CreateSessionResponse) {
    this.id = response.getSessionId()
    if (response.hasFileSize()) {
      this.metadata.diskFileSize = this.metadata.computedFileSize =
        response.getFileSize()!
    }
  }
}
export class OmegaEditService implements IEditService {
  private session: Session | undefined = undefined
  constructor() {}
  async set(editingFile: string) {
    try {
      this.session = new Session(await createSession(editingFile))
    } catch {
      throw new Error('Could not setup Omegaeditservice')
    }
  }
}
// service requires a running server
