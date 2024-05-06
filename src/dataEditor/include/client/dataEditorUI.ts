export interface DataEditorUI {
  show(): Promise<void>
  sendMessage(msg: any): void
}
