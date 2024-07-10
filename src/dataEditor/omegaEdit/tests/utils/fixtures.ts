import { FilePath } from '../..'

export interface Session {
  target: FilePath
}
export interface ServiceProvider {
  getService(): Promise<Service>
}
export interface Service {
  sessionCount(): number
  createSession(filePath: FilePath): Promise<Session>
}

export class OEServer implements ServiceProvider {
  getService(): Promise<OEService> {
    return new Promise((resolve, reject) => {
      resolve(new OEService())
    })
  }
}
export const OmegaEditServer = new OEServer()
export function validateFilePath(filePath: FilePath): boolean {
  return filePath.fullPath().at(0) == '/'
}
export class OEService implements Service {
  public sessions: Session[] = []
  createSession(filePath: FilePath): Promise<Session> {
    return new Promise((resolve, reject) => {
      if (!validateFilePath(filePath)) reject('Invalid FilePath')
      const newSession = { target: filePath }
      if (
        this.sessions.find((s) => {
          return s.target.fullPath() == newSession.target.fullPath()
        })
      )
        reject('Session already exists')
      this.sessions.push(newSession)
      resolve(newSession)
    })
  }
  sessionCount() {
    return this.sessions.length
  }
}
