// export type ServiceEditHandle = (
//   editType: string,
//   callback: (...args: any[]) => any
// ) => Promise<void>
export interface EditHandler {
  search(): void
  replace(): void
  delete(): void
}
export interface EditService {
  register(source: DataSource): Promise<EditServiceClient>
  activeUsers(): number
}
export interface EditServiceClient {
  close(): void
  id(): string
  request: (request: any) => any
  onDidProcessRequest: (response: any) => any
}

export interface DataSource {}
export interface GetDataSourceStrategy {
  get(): Promise<DataSource>
}
export interface ServiceUser<S extends DataSource> {
  dataSource(): S
  // readonly getSource: GetDataSourceStrategy
  // readonly handler: EditHandler
} // OmegaEdit implements this as Session type
