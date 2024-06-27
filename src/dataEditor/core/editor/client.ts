import { EditService } from '../service'
import { DataEditorUI } from './ui'

export abstract class DataEditor {
  protected abstract editService: EditService
  protected abstract ui: DataEditorUI
}
