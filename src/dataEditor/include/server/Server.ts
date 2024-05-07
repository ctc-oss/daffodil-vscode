// - configureOmegaEditPort()
//     - checkServerListening()
//       - setupLogging()
//       - serverStart()
//         - serverStop()
//         - oe::startServer()
//         - getServerInfo()
//         - getHeartbeat()
//       - getClient()
//       - getHeartbeat()

// import net from 'net'
// import { IEditService, IServiceMediator } from '../service/editorService'

export type ServerProcess = {
  pidFile: string
  pid: number
}

// export class ServiceHeartbeat {
//   readonly interval: number = 1000
//   protected intervalId: NodeJS.Timeout
//   constructor(
//     readonly id: string,
//     readonly process: (hb: IServerHeartbeat) => any
//   ) {
//     this.intervalId = setInterval(() => {
//       getServerHeartbeat([], this.interval).then(process)
//     }, this.interval)
//   }
// }
