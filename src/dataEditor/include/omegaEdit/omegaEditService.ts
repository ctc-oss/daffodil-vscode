import { createSession } from '@omega-edit/client'
import { Session } from './Session'
import {
  IEditorMediator,
  MediatorNotification,
} from '../mediator/editorMediator'
import { IEditService } from '../service/editorService'
import {
  SessionInfoNotification,
  ViewportRefreshNotification,
} from './Notifications'
import { MessageLevel, NotificationType } from '../mediator/notification'

export class OmegaEditService extends IEditService {
  static ViewportCapacity = 1024
  private session: Session | undefined = undefined

  constructor(
    mediator: IEditorMediator,
    readonly onDisposal: () => any
  ) {
    super(mediator, onDisposal, 'OmegaEditorService')
  }
  [Symbol.dispose](): void {
    throw new Error('Method not implemented.')
  }
  async setDataSource(editingFile: string) {
    const response = await createSession(editingFile)
    this.session = await Session.FromResponse(response, (metadata) => {
      this.mediator.notify(new SessionInfoNotification(metadata), this)
    })
    this.session.createViewport(0, (data) => {
      this.mediator.notify(new ViewportRefreshNotification(data), this)
    })
  }
  request<T>(notification: MediatorNotification<T>) {
    switch (notification.command) {
      case NotificationType.showMessage:
        const { level, msg } = notification.data as ShowMessage
        switch (level) {
          case MessageLevel.Info:
            console.debug('[INFO] ' + msg)
            // this.mediator.notify({}) // Can be implemented
            break
        }
        break
    }
  }
}
interface ShowMessage {
  readonly level: MessageLevel
  readonly msg: string
}
