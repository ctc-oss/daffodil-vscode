export interface DataEditor {}
export abstract class DataEditorInitializer<D extends DataEditor = DataEditor> {
  abstract Initialize(): Promise<D>
}
