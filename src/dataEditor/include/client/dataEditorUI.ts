export interface DataEditorUI {
  show(): Promise<void>
  sendMessage(msg: any): void
  setInputHandler(handler: UIInputHandler): void
}
export type UIInputHandler = (input: any) => any
