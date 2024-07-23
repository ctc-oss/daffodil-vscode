import {
  DataSource,
  EditService,
  EditServiceClient,
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
    protected serviceClient: EditServiceClient,
    protected ui: DataEditorUI
  ) {}
  dataSource(): DataSource {
    throw ''
  }
}
