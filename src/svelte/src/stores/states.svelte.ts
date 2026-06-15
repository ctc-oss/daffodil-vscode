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

import { ViewportState } from 'editor_components/DataDisplays/CustomByteDisplay/ViewportState.svelte.ts'

// import { ViewportDataState } from 'editor_components/DataDisplays/CustomByteDisplay/Viewport.svelte'
// import { EditByteModes } from 'ext_types'

/// Unique WebviewPanel Message ID
let uiMsgId = $state<string>('')

/**
 * Sets the UI message ID
 * @param id ID string
 */
export const setUIMsgId = (id: string) => {
  uiMsgId = id
}

/**
 * Gets the UI Message ID string
 * @returns `string` UI Message ID
 */
export const getUIMsgId = () => uiMsgId

/**
 * Checks a `string` value for the DFDL debug prefix
 * @param id ID to check
 * @returns `boolean` `true` if `id` contains DFDL debug prefix, otherwise `false`
 */
export const isUIDebugAttached = (id: string) => {
  return id.includes('dfdl-')
}

const viewportState = $state<ViewportState>(new ViewportState(''))
export const currentViewport = () => viewportState
