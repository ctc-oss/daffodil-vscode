import type { DisplayRadix, EditByteModes } from 'dataEditor/include/types'

export type ApplyChanges = {
  offset: number
  originalSegment: Uint8Array | never[]
  editedSegment: Uint8Array
}
export type RequestEditedData = {
  viewportId: string
  startOffset: number
  selectionSize: number
  editedContentStr: string
  radix: DisplayRadix
  editMode: EditByteModes
}

// export type RequestEditedData = [
//   viewportId: string,
//   startOffset: number,
//   selectionSize: number,
//   editedContentStr: string,
//   radix: DisplayRadix,
//   editMode: EditByteModes,
// ]
export type ScrollViewport = {
  scrollToOffset: number
  bytesPerRow: number
  numLinesDisplayed: number
}
export type EditorOnChange = {
  fileOffset: number
  selectionData: Uint8Array
  encoding: string
  selectionSize: number
  editMode: EditByteModes
}
export type SaveSegment = {
  startOffset: number
  length: number
}
export type Profile = {
  startOffset: number
  length: number
}
export interface Search {
  searchDataStr: string
  caseInsensitive: boolean
  isReverse: boolean
  encoding: string
  searchStartOffset: number
  searchLength: number
  limit: number
}
export interface Replace extends Search {
  replaceDataStr: string
  overwriteOnly: boolean
}
