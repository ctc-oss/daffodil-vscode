export interface DataEditorUI {
  onInputEvent: (input: any) => any
  onClosed: (listener: (e: void) => any) => void
  updateUI: (data: any) => any
}
// export function CreateDataEditorUI(): Promise<DataEditorUI> {}
