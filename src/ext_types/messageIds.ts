export const EditorRequestIds = [
  'clearChanges',
  'applyChanges',
  'fileInfo',
  'heartbeat',
  'profile',
  'redoChange',
  'replaceResults',
  'requestEditedData',
  'save',
  'saveAs',
  'saveSegment',
  'scrollViewport',
  'search',
  'replace',
  'undoChange',
  'viewportRefresh',
  'showMessage',
  'setUITheme',
  'editorOnChange',
] as const

export const EditorResponseIds = [
  'clearChanges',
  'counts',
  'applyChanges',
  'fileInfo',
  'heartbeat',
  'profile',
  'redoChange',
  'replaceResults',
  'requestEditedData',
  'save',
  'saveAs',
  'saveSegment',
  'scrollViewport',
  'search',
  'replace',
  'undoChange',
  'viewportRefresh',
  'showMessage',
  'setUITheme',
  'editorOnChange',
  'bytePos1b',
] as const

export type EditorRequestId = (typeof EditorRequestIds)[number]
export type EditorResponseId = (typeof EditorResponseIds)[number]
export function isEditorMessageId(id: string): id is EditorRequestId {
  return (EditorRequestIds as readonly string[]).includes(id)
}
export function isEditorResponseId(id: string): id is EditorResponseId {
  return (EditorResponseIds as readonly string[]).includes(id)
}
