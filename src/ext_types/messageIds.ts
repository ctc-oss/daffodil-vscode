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

export type EditorMessageId = (typeof EditorRequestIds)[number]

export function isEditorMessageId(id: string): id is EditorMessageId {
  return (EditorRequestIds as readonly string[]).includes(id)
}
