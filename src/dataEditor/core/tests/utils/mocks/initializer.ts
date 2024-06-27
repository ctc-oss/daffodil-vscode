// import { DataEditor } from '../../../client/client'
// import { DataEditorInitializer } from '../../../client/initializer'
// import { EditServiceProvider } from '../../../service/provider'

// export class SyncEditor extends DataEditor {
//   constructor(public title: string) {
//     super()
//   }
// }

// export class SyncInitializer extends DataEditorInitializer<SyncEditor> {
//   constructor(public title: string) {
//     super()
//   }
//   Initialize(): Promise<SyncEditor> {
//     return new Promise((resolve) => {
//       resolve(new SyncEditor(this.title))
//     })
//   }
// }
// export type AsyncResult = number
// export function asyncFunc(time: number): Promise<AsyncResult> {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve(time)
//     }, time)
//   })
// }
// export type MockUI = { title: string; html: string }
// export class AsyncComplexEditor extends DataEditor {
//   constructor(
//     public asyncResult: AsyncResult,
//     public components?: any[]
//   ) {
//     super()
//   }
// }
// export class AsyncComplexInitializer extends DataEditorInitializer<AsyncComplexEditor> {
//   constructor(
//     public serviceGetter: typeof asyncFunc,
//     public components?: any[]
//   ) {
//     super()
//   }
//   async Initialize(): Promise<AsyncComplexEditor> {
//     return new Promise(async (resolve) => {
//       const result = await this.serviceGetter(300)
//       resolve(new AsyncComplexEditor(result, this.components))
//     })
//   }
// }
// export type DataEditorReturnType<I extends DataEditorInitializer<DataEditor>> =
//   I extends DataEditorInitializer<infer D> ? D : never

// export async function MockinitializerInvoker<D extends DataEditor>(
//   initializer: DataEditorInitializer<D>
// ): Promise<DataEditorReturnType<typeof initializer>> {
//   return await initializer.Initialize()
// }

// class AsyncServiceProvider implements EditServiceProvider {}
