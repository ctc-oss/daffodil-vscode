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

export const BYTE_VALUE_DIV_WIDTH = 24

export type ByteValue = {
  offset: number
  text: string
  value: number
  editingActive: boolean
}

export const byteActionPxOffsets = {
  left: 0,
  right: 0,
  top: 0,
}

export enum ByteValuePxWidths {
  DISPLAY = 20,
  EDITING = 68,
}
type ByteValueDivWidths = 20 | 68

export let ByteValueArray: Array<ByteValue> = []

export type EditByteInsertionKeys = 'insert-left' | 'insert-right'
export type EditByteInsertionElements = {
  'insert-left': HTMLDivElement
  'insert-right': HTMLDivElement
}
export const EditByteInsertionElements = {
  'insert-left': HTMLDivElement,
  'insert-right': HTMLDivElement,
}
export type FocusedByteValue = {
  byte: ByteValue
  active: boolean
}
export const FocusedByteValue = {
  byte: {
    offset: 0,
    text: '',
    value: 0,
  },
  active: false,
}

export function set_focused_byte(event: Event) {
  const click = event as PointerEvent

  const elements = get_edit_byte_element_refs() as EditByteInsertionElements
  const clickedByteElement = click.target as HTMLDivElement
}

export function get_edit_byte_element_refs(
  specificElement?: EditByteInsertionKeys
): HTMLDivElement | EditByteInsertionElements {
  return specificElement
    ? (document.getElementById(specificElement) as HTMLDivElement)
    : ({
        'insert-left': document.getElementById('insert-left'),
        'insert-right': document.getElementById('insert-right'),
      } as EditByteInsertionElements)
}

export function update_pixel_width(
  pixelWidth: string,
  offset?: number
): string {
  return (parseInt(pixelWidth.split('px')[0]) + offset).toString() + 'px'
}

export const bytesPerRow = writable(16)
export const editingByte = writable(false)
