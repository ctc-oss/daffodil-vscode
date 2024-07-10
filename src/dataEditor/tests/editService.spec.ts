import { describe } from 'mocha'
import {
  EditService,
  ServiceEditHandle,
  ServiceUser,
  Session,
} from '../core/service/editService'
import { FilePath } from '../omegaEdit'

class Service implements EditService {
  users: ServiceUser[] = []
  register(requester: ServiceUser): Promise<void> {
    return new Promise((res) => {
      requester.setEditHandle()
      this.users.push(requester)
    })
  }
  activeSessions(): number {
    return 0
  }
}
class Editor implements ServiceUser {
  editor: ServiceEditHandle
  constructor(service: Service) {}
  setEditHandle(handler: ServiceEditHandle): void {
    throw new Error('Method not implemented.')
  }
  UserInput(type: string) {}
}
describe('Edit Service Abstraction Behavior', () => {})
