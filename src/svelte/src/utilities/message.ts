import { ChannelEvent, GetEventChannel } from 'dataEditor/messages'
import type { AvailableChannelTypes } from 'dataEditor/messages/dataEditorMessages'
import { writable } from 'svelte/store'

/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export enum MessageCommand {
  clearChanges,
  applyChanges,
  editorOnChange,
  fileInfo,
  heartbeat,
  profile,
  redoChange,
  replaceResults,
  requestEditedData,
  save,
  saveAs,
  saveSegment,
  scrollViewport,
  search,
  replace,
  searchResults,
  setUITheme,
  showMessage,
  undoChange,
  updateLogicalDisplay,
  viewportRefresh,
}

export enum MessageLevel {
  Error,
  Info,
  Warn,
}

export type EditorMessage = {
  command: MessageCommand
  data: Record<string, any>
}

export const GetRequester = <Type extends keyof AvailableChannelTypes>(
  tag: Type,
  id: string
) => {
  return GetEventChannel<Type>(tag, id).GetRequester()
}
export const ExtractChannelId = (
  doc: Document
): [keyof AvailableChannelTypes, string] => {
  const info = doc.body.id.split('-')
  const channelType = info[0] as keyof AvailableChannelTypes
  const id = info[1]
  return [channelType, id]
}
const channelRequester = writable()
ChannelEvent.on('added', (msg) => {
  channelRequester.set(msg.channel)
  console.log('Channel added ', msg.id, msg.channel)
})
