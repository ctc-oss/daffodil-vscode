import { writable } from "svelte/store"

export type ByteValue = {
  offset: number
  text: string
  value: number
}

export type ByteValues = Array<ByteValue>
export const bytesPerRow = writable(16)
