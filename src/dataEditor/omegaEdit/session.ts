import { ServiceUser } from '../core/service/editService'

export class Session {
  constructor(readonly id: string) {}
  createViewport(): Promise<void> {
    throw ''
  }
}
