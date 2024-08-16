import {
  DataEditorRequestEventMap,
  type DataEditorMessage,
  type DataEditorRequestEvents,
} from 'dataEditor/messages'
import type {
  ApplyChanges,
  RequestEditedData,
  ScrollViewport,
  EditorOnChange,
  SaveSegment,
  Profile,
  Search,
  Replace,
} from 'dataEditor/messages/dataEditorMessages'
import { EventEmitter } from 'stream'

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

// export const SvelteUIRequester = CreateRequester()
// SvelteUIRequester.emit('applyChanges', {})
export function EventChannelId(doc: Document) {
  return doc.body.id
}
const RequestEventEmitter = new EventEmitter<DataEditorRequestEvents>()
type RequestMap = {
  [K in keyof DataEditorRequestEvents]: (
    ...request: DataEditorRequestEvents[K]
  ) => void
}
export const RequestMap: RequestMap = {
  clearChanges: function (): void {
    RequestEventEmitter.emit('clearChanges')
  },
  redoChange: function (): void {
    RequestEventEmitter.emit('redoChange')
  },
  undoChange: function (): void {
    RequestEventEmitter.emit('undoChange')
  },
  saveAs: function (): void {
    RequestEventEmitter.emit('saveAs')
  },
  save: function (): void {
    RequestEventEmitter.emit('save')
  },
  applyChanges: function (request: ApplyChanges): void {
    RequestEventEmitter.emit('applyChanges', { ...request })
  },
  requestEditedData: function (request: RequestEditedData): void {
    throw new Error('Function not implemented.')
  },
  scrollViewport: function (request: ScrollViewport): void {
    throw new Error('Function not implemented.')
  },
  editorOnChange: function (request: EditorOnChange): void {
    throw new Error('Function not implemented.')
  },
  saveSegment: function (request: SaveSegment): void {
    throw new Error('Function not implemented.')
  },
  profile: function (request: Profile): void {
    throw new Error('Function not implemented.')
  },
  search: function (request: Search): void {
    throw new Error('Function not implemented.')
  },
  replace: function (request: Replace): void {
    throw new Error('Function not implemented.')
  },
}
class SvelteRequestMap extends DataEditorRequestEventMap<DataEditorMessage> {
  on<K extends keyof DataEditorMessage>(
    event: K,
    listener: (req: DataEditorMessage[K]) => void
  ) {
    RequestEventEmitter.on(event, (r) => {
      listener(r)
    })
  }
  // protected map = RequestMap
  constructor() {
    super({ ...RequestMap })
  }
}
class RequestEvents {
  constructor(map: RequestMap = RequestMap) {}
  on<K extends keyof RequestMap>(
    type: K,
    listener: (...request: DataEditorRequestEvents[K]) => void
  ) {}
}
class ResponseEvents {}

class EventChannel {
  constructor(
    readonly id: string,
    public req: DataEditorRequestEventMap<DataEditorMessage>,
    public res: ResponseEvents
  ) {}
}
const EC = new EventChannel(
  'test',
  new SvelteRequestMap(),
  new ResponseEvents()
)
EC.req.on('applyChanges', (r) => {
  // some op
  localRes.emit('applyChanges', {})
})
// EC.res.on() // UI uses this to attach response listeners
