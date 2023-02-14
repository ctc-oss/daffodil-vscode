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

import { writable, derived } from 'svelte/store'
import { validEncodingStr, validRequestableData, radixBytePad } from '../utilities/display'
import type { ValidationResponse } from '../utilities/display'

export const diskFileSize = writable(0)
export const filename = writable('')
export const filetype = writable('')
export const undoCount = writable(0)
export const changeCount = writable(0)
export const computedFilesize = writable(0)
export const editType = writable('')
export const cursorPos = writable(0)
export const gotoOffset = writable(0)
export const searchData = writable('')
export const editedCount = writable(0)
export const replaceData = writable('')
export const fileByteStart = writable(0)
export const displayRadix = writable(16)
export const addressValue = writable(16)
export const gotoOffsetMax = writable(0)
export const commitErrMsg = writable('')
export const searching = writable(false)
export const searchCaseInsensitive = writable(false)
export const searchResults = writable([])
export const searchErrMsg = writable('')
export const replaceErrMsg = writable('')
export const addressDisplay = writable('')
export const disableDataView = writable(false)
export const dataViewEndianness = writable('be')
export const viewportData = writable(new Uint8Array(0))
export const diskHash = writable('')
export const commitHash = writable('')
export const editorSelection = writable('')
export const selectionEndOffset = writable(0)
export const selectionOriginalEnd = writable(0)
export const editorEncoding = writable('hex')
export const selectionStartOffset = writable(0)
export const rawEditorSelectionTxt = writable('')
export const selectedFileData = writable(new Uint8Array(0))
export const selectionHash = writable('')
export const uneditedSelectionHash = writable('')
export const editMode = writable('simple')
export const editByteWindowHidden = writable(true)
export const focusedViewportId = writable('')

export const asciiCount = derived(viewportData, ($viewportData) => {
  return countAscii($viewportData)
})

export function countAscii(buf: Uint8Array): number {
  return buf.reduce((a, b) => a + (b < 128 ? 1 : 0), 0)
}

export const editByte = derived([selectedFileData, displayRadix, focusedViewportId, editMode], ([$selectedFileData, $displayRadix, $focusedViewportId, $editMode]) => {
  if($selectedFileData[0] !== undefined && $editMode === 'simple') {
    return ($focusedViewportId === 'logical')
      ? String.fromCharCode($selectedFileData[0])
      : $selectedFileData[0].toString($displayRadix).padStart(radixBytePad($displayRadix), '0').toUpperCase()
  }
  return ''
  }
)

export const selectionSize = derived(
  [editMode, selectionStartOffset, selectionEndOffset, editorSelection],
  ([$editMode, $selectionStartStore, $selectionEndStore, $editorSelection]) => {
    if($editMode === 'simple') return 1

    return $editorSelection !== ''
      ? $selectionEndStore - $selectionStartStore + 1
      : 0
  }
)

export const bytesPerRow = derived(displayRadix, ($displayRadix) => {
  return $displayRadix === 2 ? 8 : 16
})

export const fileByteEnd = derived(
  [bytesPerRow, diskFileSize],
  ([$bytesPerRow, $diskFileSize]) => {
    return $diskFileSize / $bytesPerRow
  }
)

export const allowCaseInsensitiveSearch = derived(
  editorEncoding,
  ($editorEncoding) => {
    return $editorEncoding === 'ascii' || $editorEncoding === 'latin1'
  }
)

export const saveable = derived([diskHash, commitHash], ([$diskHash, $commitHash])=>{
  return $diskHash !== $commitHash
})

export const requestable = derived([rawEditorSelectionTxt, focusedViewportId, editorEncoding, editMode, displayRadix], ([$rawEditorSelectionTxt, $focusedViewportId, $editorEncoding, $editMode, $displayRadix])=>{
  const ret = validRequestableData($rawEditorSelectionTxt, $focusedViewportId, $editorEncoding, $editMode, $displayRadix)
  commitErrMsg.update(() => {
    return ret.errMsg
  })
  return ret.valid
})

export const commitable = derived(
  [requestable, selectionHash, uneditedSelectionHash],
  ([$requestable, $selectionHash, $uneditedSelectionHash]) => {
    if (!$requestable || $selectionHash.length == 0) return false
    if ($selectionHash === $uneditedSelectionHash) return false
    return true
  }
)

export const searchable = derived(
  [searchData, editorEncoding],
  ([$searchData, $editorEncoding]) => {
    if ($searchData.length <= 0) {
      return false
    }
    const ret = validEncodingStr($searchData, $editorEncoding)
    searchErrMsg.update(() => {
      return ret.errMsg
    })
    return ret.valid
  }
)

export const replaceable = derived(
  [replaceData, editorEncoding, searchable],
  ([$replaceData, $editorEncoding, $searchable]) => {
    if (!$searchable) {
      return false
    }
    if ($replaceData.length <= 0) {
      return false
    }
    const ret = validEncodingStr($replaceData, $editorEncoding)
    replaceErrMsg.update(() => {
      return ret.errMsg
    })
    return ret.valid
  }
)

export const dataView = derived(selectedFileData, ($selectedFileData) => {
  return new DataView($selectedFileData.buffer)
})

export const byteOffsetPos = derived(
  [cursorPos, editorEncoding],
  ([$cursorPos, $editorEncoding]) => {
    switch ($editorEncoding) {
      case 'hex':
        return Math.floor($cursorPos / 2)
      case 'binary':
        return Math.floor($cursorPos / 8)
      default:
        return $cursorPos
    }
  }
)

export const dataViewLookAhead = derived(
  [editMode, dataView, byteOffsetPos, disableDataView],
  ([$editMode, $dataView, $byteOffsetPos]) => {
    return ($editMode === 'full')
      ? $dataView.byteLength - $byteOffsetPos.valueOf()
      : $dataView.byteLength
  }
)

export const int8 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
  ]) => {
    try {
      if ($dataViewLookAhead >= 1)
        return $dataView.getInt8($byteOffsetPos)
        .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const uint8 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView, ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView
  ]) => {
    try {
      if ($dataViewLookAhead >= 1)
        return $dataView.getUint8($byteOffsetPos)
        .toString(10)
      return ''
    } catch (RangeError) {}
    return ''
  }
)

export const int16 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 2)
        return $dataView
          .getInt16($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const uint16 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    ,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 2)
        return $dataView
          .getUint16($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const int32 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 4)
        return $dataView
          .getInt32($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const uint32 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 4)
        return $dataView
          .getUint32($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const float32 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 4)
        return $dataView
          .getFloat32($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const int64 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 8)
        return $dataView
          .getBigInt64($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const uint64 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 8)
        return $dataView
          .getBigUint64($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)

export const float64 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 8)
        return $dataView
          .getFloat64($byteOffsetPos, $dataViewEndianness === 'le')
          .toString(10)
    } catch (RangeError) {}
    return ''
  }
)
