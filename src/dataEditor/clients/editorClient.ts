import { Disposable } from 'vscode'
import { DataEditor } from '../core/editor/client'
import { DataEditorUI } from '../core/editor/ui'
import { EditService } from '../core/service'

export abstract class DataEditorClient
  extends DataEditor
  implements Disposable
{
  constructor(
    protected editService: EditService,
    protected ui: DataEditorUI,
    private disposables: Disposable[]
  ) {
    super()
  }
  dispose() {
    this.disposables.forEach((item) => {
      item.dispose()
    })
  }
}
