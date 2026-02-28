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
] as const

export type EditorMessageId = (typeof EditorMessageIds)[number]

export const ExtensionMessageIds = [
  'showMessage',
  'setUITheme',
  'editorOnChange',
] as const

export type ExtensionMessageId = (typeof ExtensionMessageIds)[number]

export function isEditorMessageId(id: string) {
  return (EditorMessageIds as readonly string[]).includes(id)
}

export function isExtensionMessageId(id: string) {
  return (ExtensionMessageIds as readonly string[]).includes(id)
}
