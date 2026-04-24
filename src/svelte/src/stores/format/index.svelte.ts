import {
  type BytesPerRow,
  type AvailableStrEncodings,
  type RadixValues,
} from '../../../../ext_types'
export type RadixSelections = { display: RadixValues; address: RadixValues }
/*
  States that are intended to be mutated from Component bindings, i.e, `bind:value={}`
  must be wrapped as an object (below) or mutated via functions. Function mutation is invalid
  for component bindings because the bound value must be an identifier of a varible and not a function.
*/
export const radixSelections = $state<RadixSelections>({
  display: 16,
  address: 16,
})
export type EditorState = {
  encoding: AvailableStrEncodings
}
export const editorState = $state<EditorState>({ encoding: 'latin1' })

let numDisplayLinesState = $state(20)
export const numDisplayLines = () => numDisplayLinesState
export const setNumDisplayLinesState = (lineCount: number) => {
  if (lineCount < 0) console.error(`Line count (${lineCount}) is invalid`)
  numDisplayLinesState = lineCount
}
