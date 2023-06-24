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
import type { RadixValues } from '../../../stores/configuration'
import { radixBytePad, type Viewport } from '../../../utilities/display'

export const BYTE_VALUE_DIV_OFFSET: number = 24
export const VIEWPORT_SCROLL_INCREMENT: number = 512

export type ByteValue = {
  offset: number
  text: string | undefined
  value: number
}

export const null_byte = () => {
  return {
    offset: -1,
    text: '',
    value: -1,
  } as ByteValue
}

export type EditAction =
  | 'insert-before'
  | 'insert-after'
  | 'insert-replace'
  | 'delete'
  | 'byte-input'

export interface EditEvent {
  action: EditAction
}

export interface EditByteEvent extends EditEvent {
  targetByte: ByteValue
}
export enum ViewportBoundaryTrigger {
  SCROLL_TOP,
  SCROLL_BOTTOM,
}

export const scroll_boundary_event = (top: boolean, end: boolean) => {
  return top
    ? ViewportBoundaryTrigger.SCROLL_TOP
    : ViewportBoundaryTrigger.SCROLL_BOTTOM
}

export type ByteSelectionEvent = {
  targetElement: HTMLDivElement
  targetByte: ByteValue
}
export const RADIX_REGEX_MATCH_STR = {
  16: /[0-9a-fA-F]{2}/g,
  10: /[0-9]{3}/g,
  8: /[0-8]{3}/g,
  2: /[0-1]{8}/g,
}
export const processingViewportRefresh = writable(false)
export class ViewportData_t {
  data = new Uint8Array(0)
  fileOffset = -1
  length = -1
  bytesLeft = -1
  capacity = this.data.length
}
export class ViewportDataStore_t extends SimpleWritable<ViewportData_t> {
  protected init(): ViewportData_t {
    return new ViewportData_t()
  }
  public physical_byte_values(
    radix: RadixValues,
    bytesPerRow: 16 | 8
  ): ByteValue[] {
    const byteValues =
      this.physical_display(radix, bytesPerRow).match(
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

  public subarray(from: number, to: number): Uint8Array {
    return this.storeData().data.subarray(from, to)
  }
  public slice(from: number, to: number): Uint8Array {
    return this.storeData().data.slice(from, to)
  }

  private physical_display(radix: RadixValues, bytesPerRow: 16 | 8): string {
    let result = ''
    let arr = this.storeData().data
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

export const viewport = new ViewportDataStore_t()

export const viewportFileOffset = writable(0)
export class ViewportDataStore extends SimpleWritable<Uint8Array> {
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
      this.physical_display(radix, bytesPerRow).match(
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
  private physical_display(radix: RadixValues, bytesPerRow: 16 | 8): string {
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
export const _viewportData = new ViewportDataStore()

// class ViewportDataSegments {
//   public prefix = new ViewportDataStore()
//   public head = new ViewportDataStore()
//   public tail = new ViewportDataStore()
//   public next = new ViewportDataStore()
// }
// // export type ViewportDisplaySegment = keyof ViewportDataSegments['head'] | keyof ViewportDataSegments['tail']
// // export type SetableViewportSegments = ViewportDisplaySegment | 'next'

// export class ViewportBuffers extends SimpleWritable<ViewportDataSegments> {
//   static BUFFER_SIZE = 512
//   static DISPLAY_SIZE = 1024

//   private _displaySegment: number = 0

//   constructor(){
//     super()
//     this._generate_mock_data(get(this.store).prefix)
//     this._generate_mock_data(get(this.store).head)
//     this._generate_mock_data(get(this.store).tail)
//     this._generate_mock_data(get(this.store).next, true)
//   }

//   public current_display_segment(): number {
//     return this._displaySegment
//   }

//   protected init(): ViewportDataSegments {
//     return new ViewportDataSegments()
//   }

//   private _generate_mock_data(data: ViewportDataStore, reverse: boolean = false) {
//     !reverse
//       ? data.set(new Uint8Array(ViewportBuffers.BUFFER_SIZE).map((v,i) => {
//           return (i*(this._displaySegment+1)) % 256
//         }))
//       : data.set(new Uint8Array(ViewportBuffers.BUFFER_SIZE).map((v,i) => {
//           return 256 - (i*(this._displaySegment+1))
//         }))
//   }

//   public display_buffers(): [ViewportDataStore, ViewportDataStore] {
//     return [get(this.store).head, get(this.store).tail]
//   }

//   public swap_buffers(trigger: ViewportBoundaryTrigger) {
//     if(trigger === ViewportBoundaryTrigger.SCROLL_BOTTOM) {
//       this.store.update(dataSegments => {
//         const tmp = get(dataSegments.head)
//         dataSegments.head.set(get(dataSegments.tail))
//         dataSegments.tail.set(get(dataSegments.next))

//         dataSegments.prefix.set(tmp)
//         dataSegments.next.set(new Uint8Array(ViewportBuffers.BUFFER_SIZE))

//         return dataSegments
//       })

//       this._displaySegment++
//     }
//   }

//   // public set_segment_from(segment: SetableViewportSegments, data: Uint8Array) {
//   //   get(this.store)[segment].set(data)
//   // }
// }
// export const viewportBuffers = writable(new ViewportBuffers())

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
export function update_byte_action_offsets(
  targetDiv: HTMLDivElement,
  offsetTopBy: number = 0
) {
  byteActionPxOffsets.update((currentOffsets) => {
    currentOffsets.delete = {
      left: targetDiv.offsetLeft,
      top: targetDiv.offsetTop + BYTE_VALUE_DIV_OFFSET - offsetTopBy,
    }
    currentOffsets.input = {
      left: targetDiv.offsetLeft,
      top: targetDiv.offsetTop - offsetTopBy,
    }
    currentOffsets.insertAfter = {
      left: targetDiv.offsetLeft + BYTE_VALUE_DIV_OFFSET,
      top: targetDiv.offsetTop - offsetTopBy,
    }
    currentOffsets.insertBefore = {
      left: targetDiv.offsetLeft - BYTE_VALUE_DIV_OFFSET,
      top: targetDiv.offsetTop - offsetTopBy,
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
  offset: -1,
  value: -1,
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
