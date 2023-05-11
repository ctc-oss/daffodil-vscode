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

import { derived, get } from 'svelte/store'
import { SimpleWritable } from '../../stores/localStore'
import { EditByteModes, type RadixValues } from '../../stores/Configuration'
import { radixBytePad } from '../../utilities/display'

class SelectionData {
  startOffset = 0
  endOffset = 0
  originalEndOffset = 0
  active = false
}

class SelectionDataStore extends SimpleWritable<SelectionData> {
  protected store_init(): SelectionData {
    return new SelectionData()
  }
  public byte_length(): number {
    let data = get(this.store)
    return data.endOffset - data.startOffset + 1
  }
  public str_length(radix: RadixValues): number {
    return this.byte_length() * radixBytePad(radix)
  }
}

export const selectionData = new SelectionDataStore()

interface EditorText {
  raw: string
  formatted: string
}

class DataDisplayTexts {
  editor: EditorText = { raw: '', formatted: '' }
}

class DataDisplayTextStore extends SimpleWritable<DataDisplayTexts> {
  protected store_init(): DataDisplayTexts {
    return new DataDisplayTexts()
  }
}
export const dataDisplayTexts = new DataDisplayTextStore()

export const editMode = derived(
  selectionData,
  (selectionData) => {
    return selectionData.originalEndOffset - selectionData.startOffset <= 0
      ? EditByteModes.Single
      : EditByteModes.Multiple
  },
  EditByteModes.Single
)
