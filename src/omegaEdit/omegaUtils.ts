import { EditorClient } from './client/omega_edit_grpc_pb'
import { Empty } from 'google-protobuf/google/protobuf/empty_pb'
import {
  CreateSessionRequest,
  CreateViewportRequest,
  ObjectId,
} from './client/omega_edit_pb'

export function getVersion(c: EditorClient): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    c.getOmegaVersion(new Empty(), (err, v) => {
      if (err) {
        return reject(err)
      }
      if (!v) {
        return reject('undefined version')
      }
      return resolve(`v${v.getMajor()}.${v.getMinor()}.${v.getPatch()}`)
    })
  })
}

export function newSession(
  c: EditorClient,
  path: string | undefined
): Promise<ObjectId> {
  return new Promise<ObjectId>((resolve, reject) => {
    let request = new CreateSessionRequest()
    if (path) request.setFilePath(path)
    c.createSession(request, (err, r) => {
      if (err) {
        console.log(err.message)
        return reject(err)
      }
      let id = r?.getSessionId()
      if (!id) {
        return reject('undefined version')
      }
      return resolve(id)
    })
  })
}

export function newViewport(
  id: string,
  c: EditorClient,
  sid: ObjectId,
  offset: number,
  capacity: number
): Promise<ObjectId> {
  return new Promise<ObjectId>((resolve, reject) => {
    let request = new CreateViewportRequest()
    request.setViewportIdDesired(id)
    request.setSessionId(sid)
    request.setOffset(offset)
    request.setCapacity(capacity)
    c.createViewport(request, (err, r) => {
      if (err) {
        return reject(err)
      }
      let id = r?.getViewportId()
      if (!id) {
        return reject('undefined version')
      }
      return resolve(id)
    })
  })
}
