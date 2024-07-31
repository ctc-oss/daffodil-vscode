export interface EditHandler {
  search(): void
  replace(): void
  delete(): void
}
export interface EditService {
  register(source: DataSource): Promise<EditServiceClient>
}
export interface EditServiceClient {
  addResponseListener(listener: (response: any) => any): void
  close(): void
  id(): string
  request: (request: any) => any
  onDidProcess: (response: any) => any
}

export interface DataSource {}
export interface GetDataSourceStrategy {
  get(): Promise<DataSource>
}
