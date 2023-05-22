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

type SelectedFrameOffsets = {
  start: number
  end: number
}

export function frame_selected_on_whitespace(
  selected: HTMLTextAreaElement,
  radix: number,
  originalEndOffset: number
): SelectedFrameOffsets {
  let selectionStart = selected.selectionStart
  let selectionEnd = selected.selectionEnd
  if (selectionStart != undefined && selectionEnd != undefined) {
    if (isWhitespace(selected.value.at(selectionStart)) && selectionStart % 2) {
      ++selectionStart
    } else {
      while (
        selectionStart &&
        !isWhitespace(selected.value.at(selectionStart - 1))
      ) {
        --selectionStart
      }
    }
    selected.selectionStart = selectionStart

    // Adjust the end to align with the closest ending of content
    if (isWhitespace(selected.value.at(selectionEnd))) {
      --selectionEnd
    } else {
      while (
        selectionEnd < selected.value.length &&
        !isWhitespace(selected.value.at(selectionEnd + 1))
      ) {
        ++selectionEnd
      }
    }
    selected.selectionEnd =
      selectionEnd < selected.value.length ? selectionEnd + 1 : selectionEnd
  }

  const selectionOffsetsByRadix = {
    2: {
      start: Math.floor(selectionStart / 9),
      end: Math.floor((selectionEnd - 8) / 9 + 1),
    },
    8: {
      start: Math.floor(selectionStart / 4),
      end: Math.floor((selectionEnd - 3) / 4 + 1),
    },
    10: {
      start: Math.floor(selectionStart / 4),
      end: Math.floor((selectionEnd - 3) / 4 + 1),
    },
    16: {
      start: Math.floor(selectionStart / 3),
      end: Math.floor((selectionEnd - 2) / 3 + 1),
    },
  }

  let start =
    selected.id === 'logical'
      ? Math.floor(selectionStart / 2)
      : selectionOffsetsByRadix[radix].start

  let end = (originalEndOffset =
    selected.id === 'logical'
      ? Math.floor(selectionEnd / 2)
      : selectionOffsetsByRadix[radix].end)

  return { start, end }
}

function isWhitespace(c: string | undefined): boolean {
  return c ? ' \t\n\r\v'.indexOf(c) > -1 : false
}
