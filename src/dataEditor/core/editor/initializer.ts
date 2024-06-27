import { DataEditor } from '../../core/editor/client'

export abstract class DataEditorInitializer<D extends DataEditor = DataEditor> {
  abstract Initialize(): Promise<D>
}
