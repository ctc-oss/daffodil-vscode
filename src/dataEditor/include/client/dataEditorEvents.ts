import { MediatorEvent } from '../mediator/editorMediator'

export interface DataEditorEvent {}
export function createEvent<K extends keyof DataEditorEvent>(
  arg: K,
  id: string
): DataEditorEvent[K] {
  return {} as any
}
