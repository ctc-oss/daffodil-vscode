import { DataEditor } from '../core/editor/client'
import { DataEditorUI } from '../core/editor/ui'
import { EditService } from '../core/service'
import { Disposable } from 'vscode'
import { DataEditorInitializer } from '../core/editor/initializer'
import {
  Connection,
  DisposableService,
  OmegaEditServerManager,
} from '../omegaEditService'

export namespace StandaloneDataEditor {
  class Editor extends DataEditor implements Disposable {
    constructor(
      protected editService: DisposableService,
      protected ui: DataEditorUI
    ) {
      super()
    }
    dispose() {
      this.editService.dispose()
    }
  }

  class StandaloneInitializer extends DataEditorInitializer<Editor> {
    constructor(readonly config: { conn?: Connection }) {
      super()
    }
    Initialize(): Promise<Editor> {
      return new Promise(async (resolve, reject) => {
        const server = await OmegaEditServerManager.Connect(this.config.conn)
        const editService = await server.getService()
        const ui = {}
        resolve(new Editor(editService, ui))
      })
    }
  }
  export const Initializer = new StandaloneInitializer({})
}
