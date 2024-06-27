import { DataEditor } from './editor/client'
import { DataEditorInitializer } from './editor/initializer'

export interface DataEditorManager {
  Run<D extends DataEditor>(
    initializer: DataEditorInitializer<D>
  ): Promise<void>
}
