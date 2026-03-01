let uiMsgId = $state<string>('')
export const setUIMsgId = (id: string) => {
  uiMsgId = id
}
export const getUIMsgId = () => uiMsgId
