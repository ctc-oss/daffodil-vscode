export abstract class EditService {}
export interface EditServiceProvider {
  getService(): Promise<EditService>
}
