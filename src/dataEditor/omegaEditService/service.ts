import { EditService } from '../core/service'
import { Disposable } from 'vscode'
export class OmegaEditService implements EditService, Disposable {
  constructor(public disposal: Disposable['dispose']) {}
  dispose() {}
}
