import { DataEditorEvent } from '../../include/events'

export type EventHandlerContainer = {
  [E in keyof DataEditorEvent]: (content: DataEditorEvent[E]) => any
}
