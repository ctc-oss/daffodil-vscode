import { EventEmitter } from 'stream'
import type * as msg_types from './dataEditorMessages.d.ts'

export interface DataEditorMessage {
  clearChanges: undefined
  redoChange: undefined
  undoChange: undefined
  saveAs: undefined
  save: undefined
  applyChanges: msg_types.ApplyChanges
  requestEditedData: msg_types.RequestEditedData
  scrollViewport: msg_types.ScrollViewport
  editorOnChange: msg_types.EditorOnChange
  saveSegment: msg_types.SaveSegment
  profile: msg_types.Profile
  search: msg_types.Search
  replace: msg_types.Replace
}
/// Events that the extension should handle and emit a Response Event
export interface DataEditorRequestEvents {
  clearChanges: []
  redoChange: []
  undoChange: []
  saveAs: []
  save: []
  applyChanges: [msg_types.ApplyChanges]
  requestEditedData: [msg_types.RequestEditedData]
  scrollViewport: [msg_types.ScrollViewport]
  editorOnChange: [msg_types.EditorOnChange]
  saveSegment: [msg_types.SaveSegment]
  profile: [msg_types.Profile]
  search: [msg_types.Search]
  replace: [msg_types.Replace]
}
export interface DataEditorResponseEvents {
  requestEditedData: [response: { bytes: Uint8Array; str: string }]
}

export class DataEditorMessenger {
  private emitter = new EventEmitter<DataEditorRequestEvents>()
  constructor(private sendMessage: MessengerStrategy) {}
  send<T extends keyof DataEditorMessage>(
    type: T,
    ...[content]: DataEditorMessage[T] extends undefined
      ? []
      : [content: DataEditorMessage[T]]
  ) {
    if (!content) this.sendMessage(type, content)
    else this.sendMessage(type)
  }
}

export class UIRequestSender {
  private emitter = new EventEmitter<DataEditorRequestEvents>()
  constructor() {
    // this.getEmitter('applyChanges')()
  }
  getEmitter<T extends keyof DataEditorRequestEvents>(type: T) {
    return this.emitter.emit<T>
  }
}
export type MessengerStrategy = (type: string, msg?: object) => any
export type DataEditorRequester = EventEmitter<DataEditorRequestEvents>
export type DataEditorResponder = EventEmitter<DataEditorResponseEvents>
export abstract class DataEditorRequestEventMap<
  Requests extends DataEditorMessage,
> {
  constructor(
    private map: {
      [K in keyof Requests]: (req: Requests[K]) => void
    }
  ) {}
  abstract on<K extends keyof Requests>(
    event: K,
    listener: (req: Requests[K]) => void
  )
}
class DataEditorEventChannel {
  constructor(
    readonly id: string,
    private requester_: DataEditorRequester = new EventEmitter<DataEditorRequestEvents>(),
    private responder_: DataEditorResponder = new EventEmitter<DataEditorResponseEvents>()
  ) {}
  get requester() {
    return this.requester_
  }
  get responder() {
    return this.responder_
  }

  set requester(req: DataEditorRequester) {
    if (this.requester)
      throw `A requester already exists for event channel [${this.id}]`
    this.requester = req
  }
  set responder(res: DataEditorResponder) {
    if (this.responder)
      throw `A responder already exists for event channel [${this.id}]`
    this.responder = res
  }
}
const EventChannels: Map<string, DataEditorEventChannel> = new Map()

export class DataEditorEventManager {
  // responder = new EventEmitter<DataEditorResponseEvents>()
  private constructor() {}
  static EventChannel(id: string): DataEditorEventChannel {
    if (!EventChannels.get(id))
      EventChannels.set(id, new DataEditorEventChannel(id))
    return EventChannels.get(id)!
  }
}
export const DataEditorInputEvent = new EventEmitter<DataEditorRequestEvents>()
/*
EXT
    - Handles certain messages that are received from UI.
    - Should declare to UI what messages can be created.
    - Derived EXT classes can define additional events (how to customize listeners in UI w/o listening to all?)

UI
    - Post messages to EXT when an input event is triggered
    - Handle EXT response messages.
*/
// const SvelteEventEmitter = new EventEmitter<DataEditorRequestEvents>()
// // SvelteEventEmitter.on('...') // Register event listeners for each input event
// SvelteEventEmitter.on('requestEditedData', (args) => {
//   // specific event operation
//   this.responder.emit('requestEditedData', {
//     bytes: Uint8Array.from([0xff]),
//     str: (0xff).toString(),
//   })
