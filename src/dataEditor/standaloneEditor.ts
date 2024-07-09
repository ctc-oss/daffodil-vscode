import * as vscode from 'vscode'
import path from 'path'
import { DataEditor, DataEditorInitializer } from './core/editor'
import { DataEditorUI } from './core/editor/editorUI'
import { OmegaEditService } from './omegaEdit/editService'
import { Connection, OmegaEditServerManager } from './omegaEdit/server'

export class FilePath {
  private baseName: string
  constructor(private filepath: string) {
    this.baseName = path.basename(this.filepath)
  }
  fullPath(): string {
    return this.filepath
  }
  fileName(): string {
    return this.baseName
  }
}
export type GetTargetFileStrategy = () => Promise<FilePath>
class StandaloneEditor implements vscode.Disposable, DataEditor {
  constructor(
    protected editService: OmegaEditService,
    protected ui: DataEditorUI
  ) {}
  dispose() {
    // this.editService.dispose()
  }
}

const DefaultConfig = {
  conn: new Connection('127.0.0.1', 9000),
}
export class StandaloneInitializer extends DataEditorInitializer<StandaloneEditor> {
  constructor(
    targetFile: GetTargetFileStrategy,
    readonly config: { conn: Connection } = DefaultConfig
  ) {
    super()
  }
  Initialize(): Promise<StandaloneEditor> {
    return new Promise(async (resolve, reject) => {
      const server = await OmegaEditServerManager.Connect(this.config.conn)
      const editService = await server.getService()
      const ui = {}
      resolve(new StandaloneEditor(editService, ui))
    })
  }
}
