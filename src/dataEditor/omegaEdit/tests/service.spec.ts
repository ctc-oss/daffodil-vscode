import { describe } from 'mocha'
import { FilePath } from '../'
import assert from 'assert'
import { OmegaEditServer } from './utils/fixtures'

describe('Omega Edit Service Facade Behavior', async () => {
  const service = await OmegaEditServer.getService()
  it('Should be obtained from a ServiceProvider', async () => {
    assert(service)
  })
  it('Should provide Sessions with an interface for handling edit requests', () => {})
  describe('Service Component Interfaces', () => {
    describe('Session', async () => {
      const testFilePath = new FilePath('/test/file/path')
      const session = await service.createSession(testFilePath)
      it('Should create a session with a file as the data source', async () => {
        assert(session.target == testFilePath)
      })
      it('Should register the session when created', () => {
        assert.equal(service.sessionCount(), 1)
        assert.equal(service.sessions[0], session)
      })

      // Why are async rejections passing on resolve & reject??
      // it('Should reject if FilePath is invalid', () => {
      //   assert.rejects(async () => {
      //     await service.createSession(new FilePath('$invalid'))
      //   })
      // })
      // it('Should reject if a Session exists with a given FilePath', () => {
      //   assert.rejects(async () => {
      //     await service.createSession(testFilePath)
      //   })
      // })
      it('Should have a 1-to-many relationship with Session objects', async () => {
        await service.createSession(new FilePath('/test/file/path.2'))
        assert.equal(service.sessions.length, 2)
      })
    })
  })
})
