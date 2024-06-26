import { MediatorNotification } from '../mediator/editorMediator'
import { NotificationType } from '../mediator/notification'
import { Session, SessionMetadata } from './Session'
import { ViewportContent, Viewport } from './Viewport'

export class ViewportRefreshNotification
  implements MediatorNotification<ViewportContent>
{
  command: NotificationType = NotificationType.viewportRefresh
  data: ViewportContent
  constructor(vp: Viewport) {
    this.data = vp.getContent()
  }
}

export class SessionInfoNotification
  implements MediatorNotification<SessionMetadata>
{
  command: NotificationType = NotificationType.fileInfo
  constructor(public data: SessionMetadata) {}
}
