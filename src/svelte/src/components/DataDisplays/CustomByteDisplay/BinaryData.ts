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

import { writable } from 'svelte/store'

export const BYTE_VALUE_DIV_OFFSET = 24

export type ByteValue = {
  offset: number
  text: string
  value: number
}

export type EditByteAction =
  | 'insert-before'
  | 'insert-after'
  | 'delete'
  | 'byte-input'

export type EditByteEvent = {
  targetByte: ByteValue
  action: EditByteAction
}

type ByteActionPxOffsets = {
  insertBefore: {
    left: number
    top: number
  }
  insertAfter: {
    left: number
    top: number
  }
  delete: {
    left: number
    top: number
  }
  input: {
    left: number
    top: number
  }
}
export let byteActionPxOffsets: ByteActionPxOffsets = {
  insertBefore: {
    left: 0,
    top: 0,
  },
  insertAfter: {
    left: 0,
    top: 0,
  },
  delete: {
    left: 0,
    top: 0,
  },
  input: {
    left: 0,
    top: 0,
  },
}
export function update_byte_action_offsets(targetDiv: HTMLDivElement) {
  byteActionPxOffsets = {
    insertBefore: {
      left: targetDiv.offsetLeft - BYTE_VALUE_DIV_OFFSET,
      top: targetDiv.offsetTop,
    },
    insertAfter: {
      left: targetDiv.offsetLeft + BYTE_VALUE_DIV_OFFSET,
      top: targetDiv.offsetTop,
    },
    delete: {
      left: targetDiv.offsetLeft,
      top: targetDiv.offsetTop + BYTE_VALUE_DIV_OFFSET,
    },
    input: {
      left: targetDiv.offsetLeft,
      top: targetDiv.offsetTop,
    },
  }
}

export enum ByteValuePxWidths {
  DISPLAY = 20,
  EDITING = 68,
}
type ByteValueDivWidths = 20 | 68

export let ByteValueArray: Array<ByteValue> = []

export const bytesPerRow = writable(16)
export const editingByte = writable(false)

export function focus_byte_input() {
  document.getElementById('byte-input').focus()
}
