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

import {
  type DataEditorMessageRequests,
  type ExtensionMessageRequests,
  type VSEditorMessagePackage,
  type VSExtensionMessagePackage,
  type MessageRequestMap,
  type PostMessageArgs,
  type MessageResponseMap,
  type ChangesInfoResponse,
  type CountResponse,
  type EditedDataResponse,
  type EditorOnChangeResponse,
  type FileInfoResponse,
  type ProfileResponse,
  type ReplaceResponse,
  type SaveAsResponse,
  type SearchResponse,
  type ViewportRefreshResponse,
} from 'ext_types'
import type { WebviewApi } from 'vscode-webview'
import {
  DefaultEditorListenerMap,
  type EditorMessageListener,
  type EditorMessageListenerMap,
} from './messages'
import type { IServerHeartbeat } from '@omega-edit/client'

type MessageRequest<K extends keyof MessageRequestMap> = {
  id: string
  payload: PostMessageArgs<MessageRequestMap, K>
}

const ListenerRegistry = new Map<
  string,
  Map<keyof MessageResponseMap, EditorMessageListener<keyof MessageResponseMap>>
>()
interface UIMessengerInterface {
  addListener<K extends keyof MessageResponseMap>(
    id: string,
    type: K,
    listener: EditorMessageListener<K>
  ): void
  postMessage<K extends keyof MessageRequestMap>(
    ...args: PostMessageArgs<MessageRequestMap, K>
  ): void
}
class UIMessenger {
  constructor(
    readonly id: string,
    private uiAPI: UIMessengerInterface
  ) {}
  addListener<K extends keyof MessageResponseMap>(
    type: K,
    listener: EditorMessageListener<K>
  ) {
    this.uiAPI.addListener(this.id, type, listener)
  }
  postMessage<K extends keyof MessageRequestMap>(
    id: string,
    ...args: PostMessageArgs<MessageRequestMap, K>
  ) {}
}
/**
 * A utility wrapper around the acquireVsCodeApi() function, which enables
 * message passing and state management between the webview and extension
 * contexts.
 *
 * This utility also enables webview code to be run in a web browser-based
 * dev server by using native web browser features that mock the functionality
 * enabled by acquireVsCodeApi.
 */
class VSCodeAPIWrapper {
  private readonly vsCodeApi: WebviewApi<unknown> | undefined
  private editorMessengerRegistry: Map<string, EditorMessageListenerMap> =
    new Map()
  constructor() {
    // Check if the acquireVsCodeApi function exists in the current development
    // context (i.e. VS Code development window or web browser)
    if (typeof acquireVsCodeApi === 'function') {
      this.vsCodeApi = acquireVsCodeApi()
    }
  }

  registerMessenger(id: string, listeners?: Partial<EditorMessageListenerMap>) {
    if (this.editorMessengerRegistry.get(id))
      throw `A listener registry is already registered with id: ${id}`
    this.editorMessengerRegistry.set(id, DefaultEditorListenerMap)

    if (listeners) {
      let registeredMap = this.editorMessengerRegistry.get(id)!

      for (const msgType in Object.keys(DefaultEditorListenerMap)) {
        if (listeners[msgType] !== undefined)
          registeredMap[msgType] = listeners[msgType]
      }
    }
    const ret = new UIMessenger(id)
  }
  /**
   * Post a message (i.e. send arbitrary data) to the owner of the webview.
   *
   * @remarks When running webview code inside a web browser, postMessage will instead
   * log the given message to the console.
   *
   * @param message Arbitrary data (must be JSON serializable) to send to the extension context.
   */
  public postMessage<K extends keyof MessageRequestMap>(
    id: string,
    ...args: PostMessageArgs<MessageRequestMap, K>
  ) {
    let msg = this.createMessage(args)
    msg.id = id
    this._postMessage(msg)
    // if (this.vsCodeApi) {
    //   this.vsCodeApi.postMessage(message)
    // } else {
    //   console.log(message)
    // }
  }
  public createMessage<K extends keyof MessageRequestMap>(
    payload: PostMessageArgs<MessageRequestMap, K>
  ): MessageRequest<K> {
    return {
      id: '',
      payload: payload,
    }
  }
  public addMessageListener<K extends keyof MessageResponseMap>(
    id: string,
    type: K,
    listener: EditorMessageListener<K>
  ) {
    if (!ListenerRegistry.get(id))
      ListenerRegistry.set(
        id,
        new Map<
          keyof MessageResponseMap,
          EditorMessageListener<keyof MessageResponseMap>
        >()
      )

    const registeredMap = ListenerRegistry.get(id)!
    registeredMap.set(type, (msg) => {
      listener(msg as MessageResponseMap[K])
    })

    console.log(ListenerRegistry)
    console.log(ListenerRegistry.get(id))

    window.addEventListener('message', (msg) => {
      const id = msg.data.id
      let registeredListenerMap = ListenerRegistry.get(id)
      if (!registeredListenerMap) return
      let msgCb = registeredListenerMap.get(type)!
      msgCb(msg.data.data)
      // registeredListener![type](msg.data.data as MessageResponseMap[K])
    })
  }
  /**
   * Get the persistent state stored for this webview.
   *
   * @remarks When running webview source code inside a web browser, getState will retrieve state
   * from local storage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
   *
   * @return The current state or `undefined` if no state has been set.
   */
  public getState(): unknown | undefined {
    if (this.vsCodeApi) {
      return this.vsCodeApi.getState()
    } else {
      const state = localStorage.getItem('vscodeState')
      return state ? JSON.parse(state) : undefined
    }
  }

  /**
   * Set the persistent state stored for this webview.
   *
   * @remarks When running webview source code inside a web browser, setState will set the given
   * state using local storage (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
   *
   * @param newState New persisted state. This must be a JSON serializable object. Can be retrieved
   * using {@link getState}.
   *
   * @return The new state.
   */
  public setState<T extends unknown | undefined>(newState: T): T {
    if (this.vsCodeApi) {
      return this.vsCodeApi.setState(newState)
    } else {
      localStorage.setItem('vscodeState', JSON.stringify(newState))
      return newState
    }
  }

  private _postMessage(message: any) {
    if (this.vsCodeApi) {
      this.vsCodeApi.postMessage(message)
    } else {
      console.error("The 'vsCodeApi' object is invalid")
    }
  }
}

// Exports class singleton to prevent multiple invocations of acquireVsCodeApi.
export const vscode = new VSCodeAPIWrapper()
