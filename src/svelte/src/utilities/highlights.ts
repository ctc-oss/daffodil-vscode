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

import { derived, get, writable } from 'svelte/store'
import { selectionDataStore } from '../stores'
import { viewport } from '../components/DataDisplays/CustomByteDisplay/BinaryData'

export type ViewportByteHightlightLUT = Array<boolean>

let activeSelectionHighlightLUT = Array(1024) as ViewportByteHightlightLUT
let processingSelectionHighlightLUT = Array(1024) as ViewportByteHightlightLUT

export const activeSelectionHighlights = derived(
  [selectionDataStore],
  ([$selectionData]) => {
    const start = $selectionData.startOffset
    const end = $selectionData.originalEndOffset

    for (let i = 0; i < 1024; i++) {
      activeSelectionHighlightLUT[i] = i >= start && i <= end ? true : false
    }

    return activeSelectionHighlightLUT
  }
)

export const processingSelectionHighlights = derived(
  [selectionDataStore],
  ([$selectionData]) => {
    const start = $selectionData.startOffset
    const end = $selectionData.endOffset
    console.log(start, end)
    for (let i = 0; i < 1024; i++) {
      processingSelectionHighlightLUT[i] = i >= start && i <= end ? true : false
    }

    return processingSelectionHighlightLUT
  }
)
