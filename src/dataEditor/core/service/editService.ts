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
  register(source: DataSource): Promise<void>
  activeUsers(): number
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
