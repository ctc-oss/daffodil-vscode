import { ExtensionMessages } from 'ext_types'

interface DataEditorDOMInterface {
  addMessageListener: <K extends keyof ExtensionMessages>(
    type: K,
    listener: (response: any) => void
  ) => void
}

declare global {
  interface Window {
    dataeditor: DataEditorDOMInterface
  }
}

export {}
