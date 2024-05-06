export interface IStatusable {
  readonly statusTag: string
  readonly status: string
}
export interface IStatusUpdater {
  setTag(tag: string): void
  update(status: string): void
}
