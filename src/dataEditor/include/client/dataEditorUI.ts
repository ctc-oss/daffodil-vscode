export interface DataEditorUI {
  // show(): Promise<void>
  sendMessage(msg: any): void
}
export type UIInputHandler = (input: any) => any
