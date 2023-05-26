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

import { get, writable } from 'svelte/store'
import { SimpleWritable } from '../../../stores/localStore'
import type { EditByteModes, RadixValues } from '../../../stores/configuration'
import { radixBytePad } from '../../../utilities/display'

export const BYTE_VALUE_DIV_OFFSET = 24

export type ByteValue = {
  offset: number
  text: string | undefined
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
export type ByteSelectionEvent = {
  targetElement: HTMLDivElement
  targetByte: ByteValue
  type: keyof typeof EditByteModes
}
export const RADIX_REGEX_MATCH_STR = {
  16: /[0-9a-fA-F]{2}/g,
  10: /[0-9]{3}/g,
  8: /[0-8]{3}/g,
  2: /[0-1]{8}/g,
}
export class ViewportData extends SimpleWritable<Uint8Array> {
  protected init(): Uint8Array {
    return new Uint8Array()
  }
  public set(value: Uint8Array): void {
    this.store.set(Uint8Array.from(value))
  }
  public physical_byte_values(
    radix: RadixValues,
    bytesPerRow: 16 | 8
  ): ByteValue[] {
    const byteValues =
      this.phyiscal_display(radix, bytesPerRow).match(
        RADIX_REGEX_MATCH_STR[radix]
      ) || []

    return byteValues.map((byteStr, index) => {
      return {
        text: byteStr,
        offset: index,
        value: parseInt(byteStr, radix),
      }
    })
  }
  private phyiscal_display(radix: RadixValues, bytesPerRow: 16 | 8): string {
    let result = ''
    let arr = get(this.store)
    if (arr.byteLength > 0) {
      const pad = radixBytePad(radix)
      let i = 0
      while (true) {
        for (let col = 0; i < arr.byteLength && col < bytesPerRow; ++col) {
          result += arr[i++].toString(radix).padStart(pad, '0') + ' '
        }
        result = result.slice(0, result.length - 1)
        if (i === arr.byteLength) {
          break
        }
        result += '\n'
      }
    }
    return result
  }
}
export const _viewportData = new ViewportData()

export type ByteActionPxOffsets = {
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

function latin1Undefined(charCode: number): boolean {
  return charCode < 32 || (charCode > 126 && charCode < 160)
}
export function update_byte_action_offsets(targetDiv: HTMLDivElement) {
  byteActionPxOffsets.update((currentOffsets) => {
    currentOffsets.delete = {
      left: targetDiv.offsetLeft,
      top: targetDiv.offsetTop + BYTE_VALUE_DIV_OFFSET,
    }
    currentOffsets.input = {
      left: targetDiv.offsetLeft,
      top: targetDiv.offsetTop,
    }
    currentOffsets.insertAfter = {
      left: targetDiv.offsetLeft + BYTE_VALUE_DIV_OFFSET,
      top: targetDiv.offsetTop,
    }
    currentOffsets.insertBefore = {
      left: targetDiv.offsetLeft - BYTE_VALUE_DIV_OFFSET,
      top: targetDiv.offsetTop,
    }
    return currentOffsets
  })
}

export enum ByteValuePxWidths {
  DISPLAY = 20,
  EDITING = 68,
}
type ByteValueDivWidths = 20 | 68

export let ByteValueArray: Array<ByteValue> = []

export const bytesPerRow = writable(16)
export const editingByte = writable(false)
export const selectedByte = writable({
  text: '',
  offset: 0,
  value: 0,
} as ByteValue)
export const byteActionPxOffsets = writable({
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
} as ByteActionPxOffsets)
export const mouseSelectionBytes = writable({ mousedown: -1, mouseup: -1 })
export function focus_byte_input() {
  document.getElementById('byte-input').focus()
}
