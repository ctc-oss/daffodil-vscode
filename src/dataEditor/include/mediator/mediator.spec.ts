import { describe, it } from 'mocha'
import {
  IEditorComponent,
  IEditorMediator,
  MediatorNotification,
} from './editorMediator'
import assert from 'assert'
import { NotificationType } from './notification'

const NumberNotification: MediatorNotification<number> = {
  command: NotificationType.applyChanges,
  data: 0,
}

class MockComponent extends IEditorComponent {
  static id: number = 0
  constructor(mediator: IEditorMediator) {
    super(mediator, 'mock-' + (MockComponent.id++).toString())
  }
  execute(notification?: MediatorNotification<any>) {
    notification
      ? this.mediator.notify(notification, this)
      : this.mediator.notify(
          { command: NotificationType.clearChanges, data: 'abc' },
          this
        )
  }
}
class MockMediator implements IEditorMediator {
  notify(
    notification: MediatorNotification<any>,
    from: IEditorComponent
  ): void {
    switch (notification.command) {
      case NotificationType.applyChanges:
        const { data } = notification as typeof NumberNotification
        assert.equal(data, NumberNotification.data)
        break
      default:
        throw new Error('Unknown notification command')
    }
  }
}

describe('Mediator Behavior', () => {
  const mediator = new MockMediator()
  it('Should throw for unkown MediatorNotification routes', () => {
    assert.throws(() => {
      const component = new MockComponent(mediator)
      component.execute()
    })
  })
  it('Should not throw for known type routes', () => {
    assert.doesNotThrow(() => {
      const component = new MockComponent(mediator)
      component.execute(NumberNotification)
    })
  })
})
