export const EditorMessageIds = [
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
  'searchResults',
  'undoChange',
  'viewportRefresh',
  'showMessage',
  'setUITheme',
  'editorOnChange',
] as const

export type EditorMessageId = (typeof EditorMessageIds)[number]

export function isEditorMessageId(id: string) {
  return (EditorMessageIds as readonly string[]).includes(id)
}
