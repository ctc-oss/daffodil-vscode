import { DataEditorResponseEvents } from './messages'

type DefaultEventResponses = {
  [R in keyof DataEditorResponseEvents]: (
    request: DataEditorResponseEvents[R]
  ) => void
}
export const DefaultInputListeners: DefaultEventResponses = {
  requestEditedData: function (
    request: [response: { bytes: Uint8Array; str: string }]
  ): void {
    throw new Error('Function not implemented.')
  },
}
