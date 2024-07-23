import { describe } from 'mocha'

class Service {}
class User {
  public source: string = ''
  constructor(public id_: string) {}
  id() {
    return this.id_
  }
}
describe('Edit Service Abstraction Behavior', () => {
  it("Should keep track of service user's IDs", () => {})
  it('Should be a facade for clients to handlie edit requests', () => {
    const service = new Service()
  })
})
