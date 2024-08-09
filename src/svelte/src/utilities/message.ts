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

export interface ServiceRequest {
  command: MessageCommand
  content?: any
}

interface SessionRequest {}
interface SessionRequest {
  fileInfo: { sessionId: string; file: string }
}
interface ViewportRequest {
  seek: { viewportId: string; offset: number; bytesPerRow: number }
}

interface ServiceRequests {
  session_fileInfo: { sessionId: string; file: string }
  viewport_seek: { viewportId: string; offset: number; bytesPerRow: number }
}
type SessionRequests = Extract<keyof ServiceRequests, `session_${string}`>
type ViewportRequests = Extract<keyof ServiceRequests, `viewport_${string}`>
type RequestType = {
  [K in keyof ServiceRequests as ServiceRequests[K] extends (
    ...args: any[]
  ) => any
    ? K
    : never]: ServiceRequests[K]
}
export function CreateServiceRequest<
  T extends SessionRequests | ViewportRequests,
>(type: T, content: ServiceRequests[T]) {}
// CreateServiceRequest("viewport_seek", )
export function CreateRequest<T extends keyof ServiceRequests>(
  type: T,
  content: ServiceRequests[T]
) {}

export type RequestStrategy = (request: ServiceRequests) => any

export abstract class DataEditorRequester {
  constructor(
    readonly SendCallback: <T extends keyof ServiceRequests>(
      request: ServiceRequests[T]
    ) => any
  ) {}
  public CreateRequest<T extends keyof ServiceRequests>(
    type: T,
    content: ServiceRequests[T]
  ) {
    this.SendCallback(content)
  }
}
