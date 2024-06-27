import { ExtensionContext, commands } from 'vscode'
import { DataEditorManager } from './manager'
import { StandaloneDataEditor } from './clients/standalone'
import { DataEditorInitializer } from './core/editor/initializer'

let Manager: DataEditorManager
export const DataEditorCommand = 'extension.data.edit'

export function activate(ctx: ExtensionContext) {
  Manager = new DataEditorManager()

  ctx.subscriptions.push(
    commands.registerCommand(
      DataEditorCommand,
      async (init: DataEditorInitializer) => {
        // Initializer needs to have all constructable components for editors
        init ? Manager.Run(init) : Manager.Run(StandaloneDataEditor.Initializer)
      }
    )
  )
  ctx.subscriptions.push(Manager)
  // ctx.subscriptions.push(OmegaEditServerManager.dispose)
}
