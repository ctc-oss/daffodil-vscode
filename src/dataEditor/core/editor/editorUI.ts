export interface DataEditorUI {
  configuration(): any
  configure(configItem: string, value: any): Promise<void>
}
// export function CreateDataEditorUI(): Promise<DataEditorUI> {}
