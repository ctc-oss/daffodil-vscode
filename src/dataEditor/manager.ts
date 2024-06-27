import { Disposable } from 'vscode'
import { DataEditor } from './core/editor/client'
import { StandaloneDataEditor } from './clients/standalone'
import { DataEditorInitializer } from './core/editor/initializer'

export class DataEditorManager implements Disposable {
  private editors: DataEditor[] = []
  private disposables: Disposable[] = []

  dispose(): void {
    this.editors = []
    this.disposables.forEach((item) => {
      item.dispose()
    })
  }

  async Run<D extends DataEditor>(
    initializer: DataEditorInitializer<D>
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const editor = initializer
        ? await initializer.Initialize()
        : await StandaloneDataEditor.Initializer.Initialize()
      this.editors.push(editor)
      resolve()
    })
  }
}
