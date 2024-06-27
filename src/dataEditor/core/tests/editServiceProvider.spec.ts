import { describe } from 'mocha'
import { EditService, EditServiceProvider } from '../service'
import assert from 'assert'

class SimpleService extends EditService {}
class SimpleProvider implements EditServiceProvider {
  getService(): Promise<SimpleService> {
    return new Promise((resolve) => {
      resolve(new SimpleService())
    })
  }
}

const ServiceUser = async (provider: EditServiceProvider) => {
  const service = await provider.getService()
  assert(service)
}

describe('Edit Service Provider Behavior', () => {
  it("Should have all required service parameters when 'getService' is invoked", () => {
    ServiceUser(new SimpleProvider())
  })
})
