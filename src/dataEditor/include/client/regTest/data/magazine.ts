export class Magazine {
  serial(): number {
    return 1234
  }
}
declare module '../lib/registry' {
  export interface DataTypeRegistry {
    magazine: Magazine
  }
  export interface DataEditorEvents {
    magazine: Magazine
  }
}
