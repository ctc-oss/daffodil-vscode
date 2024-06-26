import { ExtensionContext, commands } from 'vscode'
import { DataEditorInitializer } from './include/client/dataEditorClient'

export function activate(ctx: ExtensionContext) {
  commands.registerCommand(
    'extension.new-data-editor',
    async (init: DataEditorInitializer) => {
      const editor = init.initialize()
      ctx.subscriptions.push()
    }
  )
}
