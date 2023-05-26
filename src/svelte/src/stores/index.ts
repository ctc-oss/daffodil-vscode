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

import type { ValidationResponse } from '../utilities/display'
import { EditByteModes } from './configuration'
import { ThemeType } from '../utilities/colorScheme'
import { editMode, selectionData } from '../components/Editors/DataEditor'
import { fileMetrics } from '../components/Header/fieldsets/FileMetrics'
import {
  radixBytePad,
  regexEditDataTest,
  validateEncodingStr,
} from '../utilities/display'
import { derived, writable } from 'svelte/store'

export const UITheme = writable(ThemeType.Dark)
export const addressRadix = writable(16)
export const commitErrMsg = writable('')
export const cursorPos = writable(0)
export const dataViewEndianness = writable('le') // 'le' for little endian and 'be' for big endian
export const disableDataView = writable(false)
export const displayRadix = writable(16)
export const editByteWindowHidden = writable(true)
export const editedDataSegment = writable(new Uint8Array(0))
export const editedDataStore = writable(new Uint8Array(0))
export const editorEncoding = writable('latin1')
export const editorSelection = writable('')
export const focusedViewportId = writable('')
export const gotoOffset = writable(0)
export const gotoOffsetInput = writable('')
export const headerHidden = writable(false)
export const rawEditorSelectionTxt = writable('')
export const searchCaseInsensitive = writable(false)
export const viewportData = writable(new Uint8Array(0))
export const viewportLogicalDisplayText = writable('')
export const viewportStartOffset = writable(0)
export const viewportLength = writable(0)
export const viewportFollowingByteCount = writable(0)
export const viewportScrollTop = writable(0)
export const viewportScrollHeight = writable(0)
export const viewportClientHeight = writable(0)
export const viewportCapacity = writable(0)
export const viewportLineHeight = writable(0)

export const viewportNumLinesDisplayed = derived(
  [viewportClientHeight, viewportLineHeight],
  ([$viewportClientHeight, $viewportLineHeight]) => {
    return Math.floor($viewportClientHeight / $viewportLineHeight) + 1
  }
)

export const viewportEndOffset = derived(
  [viewportStartOffset, viewportLength],
  ([$viewportStartOffset, $viewportLength]) => {
    return $viewportStartOffset + $viewportLength
  }
)

export const viewportScrolledToTop = derived(
  [viewportScrollTop],
  ([$viewportScrollTop]) => {
    return $viewportScrollTop === 0
  }
)

export const viewportScrolledToEnd = derived(
  [viewportScrollTop, viewportScrollHeight, viewportClientHeight],
  ([$viewportScrollTop, $viewportScrollHeight, $viewportClientHeight]) => {
    return $viewportScrollTop + $viewportClientHeight >= $viewportScrollHeight
  }
)

export const offsetMax = derived(
  [viewportStartOffset, viewportLength, viewportFollowingByteCount],
  ([$viewportOffset, $viewportLength, $viewportFollowingByteCount]) => {
    // this should be the same as the computed file size
    return $viewportOffset + $viewportLength + $viewportFollowingByteCount
  }
)

export const selectionSize = derived(
  [selectionData, editorSelection],
  ([$selectionData, $editorSelection]) => {
    return $editorSelection !== ''
      ? $selectionData.endOffset - $selectionData.startOffset + 1
      : 0
  }
)

export const editByte = derived(
  [displayRadix, focusedViewportId, viewportData, selectionData],
  ([$displayRadix, $focusedViewportId, $viewportData, $selectionData]) => {
    if ($viewportData[$selectionData.startOffset] !== undefined) {
      return $focusedViewportId === 'logical'
        ? String.fromCharCode($viewportData[$selectionData.startOffset])
        : $viewportData[$selectionData.startOffset]
            .toString($displayRadix)
            .padStart(radixBytePad($displayRadix), '0')
            .toUpperCase()
    }
    return ''
  }
)

export const editedByteIsOriginalByte = derived(
  [editorSelection, editByte, focusedViewportId],
  ([$editorSelection, $editByte, $focusedViewportId]) => {
    return $focusedViewportId === 'logical'
      ? $editorSelection === $editByte
      : $editorSelection.toLowerCase() === $editByte.toLowerCase()
  }
)

export const bytesPerRow = derived(displayRadix, ($displayRadix) => {
  return $displayRadix === 2 ? 8 : 16
})

export const allowCaseInsensitiveSearch = derived(
  editorEncoding,
  ($editorEncoding) => {
    return $editorEncoding === 'ascii' || $editorEncoding === 'latin1'
  }
)

export const saveable = derived([fileMetrics], ([$fileMetrics]) => {
  return $fileMetrics.changeCount > 0
})

export const requestable = derived(
  [
    rawEditorSelectionTxt,
    focusedViewportId,
    editorEncoding,
    editMode,
    displayRadix,
  ],
  ([
    $rawEditorSelectionTxt,
    $focusedViewportId,
    $editorEncoding,
    $editMode,
    $displayRadix,
  ]) => {
    const ret = validRequestableData(
      $rawEditorSelectionTxt,
      $focusedViewportId,
      $editorEncoding,
      $editMode,
      $displayRadix
    )
    commitErrMsg.update(() => {
      return ret.errMsg
    })
    return ret.valid
  }
)

export const originalDataSegment = derived(
  [viewportData, selectionData],
  ([$viewportData, $selectionData]) => {
    return !$viewportData
      ? []
      : $viewportData.slice(
          $selectionData.startOffset,
          $selectionData.originalEndOffset + 1
        )
  }
)

export const committable = derived(
  [
    requestable,
    viewportData,
    editedDataSegment,
    selectionData,
    selectionSize,
    editMode,
    editedByteIsOriginalByte,
  ],
  ([
    $requestable,
    $viewportData,
    $selectedFileData,
    $selectionData,
    $selectionSize,
    $editMode,
    $editedByteIsOriginalByte,
  ]) => {
    if (
      !$requestable ||
      ($editedByteIsOriginalByte && $editMode === EditByteModes.Single)
    )
      return false
    const originalLength =
      $selectionData.originalEndOffset - $selectionData.startOffset
    const editedLength = $selectionData.endOffset - $selectionData.startOffset

    if (originalLength !== editedLength) return true
    for (let i = 0; i < $selectionSize; i++) {
      if (
        $viewportData[i + $selectionData.startOffset] !== $selectedFileData[i]
      )
        return true
    }

    return false
  }
)

export const gotoable = derived(
  [gotoOffset, gotoOffsetInput, offsetMax, addressRadix],
  ([$gotoOffset, $gotoOffsetInput, $gotoOffsetMax, $addressValue]) => {
    if ($gotoOffsetInput.length <= 0) return { valid: false, gotoErrMsg: '' }
    if ($gotoOffset > $gotoOffsetMax)
      return { valid: false, gotoErrMsg: 'Exceeds filesize' }
    if (!regexEditDataTest($gotoOffsetInput, $addressValue))
      return { valid: false, gotoErrMsg: 'Invalid characters' }
    return { valid: true, gotoErrMsg: '' }
  }
)

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

export const dataView = derived(
  [selectionData, editMode, viewportData, editedDataSegment],
  ([$selectionData, $editMode, $viewportData, $editedDataSegment]) => {
    return $editMode === EditByteModes.Single
      ? new DataView(
          $viewportData.buffer.slice(
            $selectionData.startOffset,
            $selectionData.startOffset + 8
          )
        )
      : new DataView($editedDataSegment.buffer)
  }
)

export const dataViewOffsetText = derived(
  [selectionData, byteOffsetPos, addressRadix],
  ([$selectionData, $byteOffsetPos, $addressValue]) => {
    return ($selectionData.startOffset + $byteOffsetPos).toString($addressValue)
  }
)

export const dataViewLookAhead = derived(
  [editMode, dataView, byteOffsetPos, disableDataView],
  ([$editMode, $dataView, $byteOffsetPos]) => {
    return $editMode === EditByteModes.Multiple
      ? $dataView.byteLength - $byteOffsetPos.valueOf()
      : $dataView.byteLength
  }
)

export const latin1 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView]) => {
    try {
      if ($dataViewLookAhead >= 1)
        return String.fromCharCode($dataView.getUint8($byteOffsetPos))
    } catch (RangeError) {}
    return ''
  }
)

export const int8 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView, displayRadix],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView, $displayRadix]) => {
    try {
      if ($dataViewLookAhead >= 1)
        return $dataView
          .getInt8($byteOffsetPos)
          .toString($displayRadix)
          .toUpperCase()
    } catch (RangeError) {}
    return ''
  }
)

export const uint8 = derived(
  [byteOffsetPos, dataViewLookAhead, dataView, displayRadix],
  ([$byteOffsetPos, $dataViewLookAhead, $dataView, $displayRadix]) => {
    try {
      if ($dataViewLookAhead >= 1)
        return $dataView
          .getUint8($byteOffsetPos)
          .toString($displayRadix)
          .toUpperCase()
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
    displayRadix,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $displayRadix,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 2)
        return $dataView
          .getInt16($byteOffsetPos, $dataViewEndianness === 'le')
          .toString($displayRadix)
          .toUpperCase()
    } catch (RangeError) {}
    return ''
  }
)

export const uint16 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    displayRadix,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $displayRadix,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 2)
        return $dataView
          .getUint16($byteOffsetPos, $dataViewEndianness === 'le')
          .toString($displayRadix)
          .toUpperCase()
    } catch (RangeError) {}
    return ''
  }
)

export const int32 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    displayRadix,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $displayRadix,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 4)
        return $dataView
          .getInt32($byteOffsetPos, $dataViewEndianness === 'le')
          .toString($displayRadix)
          .toUpperCase()
    } catch (RangeError) {}
    return ''
  }
)

export const uint32 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    displayRadix,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $displayRadix,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 4)
        return $dataView
          .getUint32($byteOffsetPos, $dataViewEndianness === 'le')
          .toString($displayRadix)
          .toUpperCase()
    } catch (RangeError) {}
    return ''
  }
)

export const int64 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    displayRadix,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $displayRadix,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 8)
        return $dataView
          .getBigInt64($byteOffsetPos, $dataViewEndianness === 'le')
          .toString($displayRadix)
          .toUpperCase()
    } catch (RangeError) {}
    return ''
  }
)

export const uint64 = derived(
  [
    byteOffsetPos,
    dataViewLookAhead,
    dataView,
    displayRadix,
    dataViewEndianness,
  ],
  ([
    $byteOffsetPos,
    $dataViewLookAhead,
    $dataView,
    $displayRadix,
    $dataViewEndianness,
  ]) => {
    try {
      if ($dataViewLookAhead >= 8)
        return $dataView
          .getBigUint64($byteOffsetPos, $dataViewEndianness === 'le')
          .toString($displayRadix)
          .toUpperCase()
    } catch (RangeError) {}
    return ''
  }
)

function validRequestableData(
  data: string,
  viewport: string,
  encoding: string,
  editMode: string,
  radix: number
): ValidationResponse {
  switch (editMode) {
    case EditByteModes.Single:
      if (data.length === 0) return { valid: false, errMsg: '' }
      return viewport === 'physical'
        ? validateEncodingStr(data, radix, editMode)
        : validateEncodingStr(data, 'latin1', editMode)
    case EditByteModes.Multiple:
      return validateEncodingStr(data, encoding)
    default:
      return { valid: false, errMsg: 'illegal edit mode' }
  }
}
