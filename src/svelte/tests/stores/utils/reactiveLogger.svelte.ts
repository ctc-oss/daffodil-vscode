import type { ViewportAttributes } from 'editor_components/DataDisplays/CustomByteDisplay/ViewportState.svelte'

// export type ReactiveValues = Omit<ViewportAttributes, 'offsetMax'>
export type ReactiveValues = ViewportAttributes
export type ReactiveLogEntry = {
  phase: 'run' | 'cleanup'
  changed: string[]
  values: ReactiveValues
}

export type ReactiveLogger = (entry: ReactiveLogEntry) => void
