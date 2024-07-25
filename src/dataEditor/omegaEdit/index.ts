import path from 'path'
import * as os from 'os'
import { DataSource, GetDataSourceStrategy } from '../core/service/editService'

export class FilePath implements DataSource {
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

export namespace FilePath {
  export const SystemTmpDirectory = (): FilePath => {
    return new FilePath(os.tmpdir())
  }
  export const CurrentDirectory = (): FilePath => {
    return new FilePath('.')
  }
}

export interface FilePathSourceStrategy extends GetDataSourceStrategy {
  get(): Promise<FilePath>
}
