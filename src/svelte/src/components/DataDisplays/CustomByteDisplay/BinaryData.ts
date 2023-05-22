import { writable } from 'svelte/store'

export type ByteValue = {
  offset: number
  text: string
  value: number
}
export enum ByteValueWidths {
  DISPLAY = 20,
  EDITING = 68
}
type ByteValueDivWidths = 20 | 68

export type ByteValues = Array<ByteValue>
export const bytesPerRow = writable(16)
export const editingByte = writable(false)
