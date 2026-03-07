import type {
  HTMLMessengerInterface,
  MessageRequestMap,
  PostMessageArgs,
} from 'ext_types'
import { vscode } from 'utilities/vscode'
let uiMsgId = $state<string>('')
export const setUIMsgId = (id: string) => {
  uiMsgId = id
}
export const getUIMsgId = () => uiMsgId
// type UIPostMessage = <K extends keyof MessageRequestMap>(
//   ...args: PostMessageArgs<MessageRequestMap, K>
// ) => void
// let UIMessengerState = $state<UIPostMessage>(() => {
//   throw 'UI Messenger State has not been initialized'
// })

// export const getUIMessengerState = () => postMessage
// export const initUIMessengerState = (id: string) => {
//   UIMessengerState = vscode.getMessenger(id)
// }
