import type { UIMessengerInterface } from 'utilities/messages'

let uiMsgId = $state<string>('')
export const setUIMsgId = (id: string) => {
  uiMsgId = id
}
export const getUIMsgId = () => uiMsgId

let uiMessengerState = $state<UIMessengerInterface>({
  addListener: (type, listener) => {
    return
  },
  postMessage: () => {
    return
  },
})

export const setUIMessenger = (uiMessenger: UIMessengerInterface) => {
  uiMessengerState = uiMessenger
  return uiMessengerState
}
export const getUIMessenger = () => uiMessengerState
