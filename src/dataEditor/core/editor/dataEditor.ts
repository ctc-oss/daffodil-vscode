import {
  DataSource,
  EditService,
  GetDataSourceStrategy,
  ServiceUser,
} from '../service/editService'
import { DataEditorUI } from './editorUI'

export abstract class DataEditorInitializer<D extends DataEditor = DataEditor> {
  abstract Initialize(): Promise<D>
}

export type EditorCommand = {
  command: string
  initializer: DataEditorInitializer
}

export abstract class DataEditor implements ServiceUser<DataSource> {
  constructor(
    protected source_: DataSource,
    editService: EditService
  ) {
    editService.register(this.source_)
  }
  dataSource(): DataSource {
    return this.source_
  }
}
