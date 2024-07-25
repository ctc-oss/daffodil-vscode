export interface EditHandler {
  search(): void
  replace(): void
  delete(): void
}
export interface EditService {
  register(source: DataSource): Promise<EditServiceClient>
}
export interface EditServiceClient {
  close(): void
  id(): string
  request: (request: any) => any
  onDidProcess: (response: any) => any
}

export interface DataSource {}
export interface GetDataSourceStrategy {
  get(): Promise<DataSource>
}
