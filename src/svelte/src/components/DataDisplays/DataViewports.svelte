<!--
Licensed to the Apache Software Foundation (ASF) under one or more
contributor license agreements.  See the NOTICE file distributed with
this work for additional information regarding copyright ownership.
The ASF licenses this file to You under the Apache License, Version 2.0
(the "License"); you may not use this file except in compliance with
the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
<script lang="ts">
  import {
    bytesPerRow,
    addressRadix,
    viewportData,
    displayRadix,
    focusedViewportId,
    editedDataSegment,
    editorEncoding,
    selectionSize,
    viewportLineHeight,
    viewportScrolledToTop,
    viewportScrolledToEnd,
    viewportScrollTop,
    viewportScrollHeight,
    viewportClientHeight,
    viewportStartOffset,
    viewportEndOffset,
    viewportLogicalDisplayText,
  } from '../../stores'
  import { UIThemeCSSClass } from '../../utilities/colorScheme'
  import {
    edit_byte_window_ref,
    radixBytePad,
    viewport_references,
    type ViewportReferences,
  } from '../../utilities/display'
  import { MessageCommand } from '../../utilities/message'
  import { createEventDispatcher, onMount } from 'svelte'
  import { editByteWindowHidden } from '../../stores'
  import { vscode } from '../../utilities/vscode'
  import { EditByteModes, RADIX_OPTIONS } from '../../stores/configuration'
  import { selectionData, editMode } from '../Editors/DataEditor'

  const eventDispatcher = createEventDispatcher()
  const viewportRefs = viewport_references() as ViewportReferences

  let currentScrollEvt: string | null, scrollSyncTimer: NodeJS.Timeout
  let editByteWindow = edit_byte_window_ref()

  //
  // reactive variables
  //

  $: addressDisplayText = makeAddressRange(
    $viewportStartOffset,
    $viewportEndOffset,
    $bytesPerRow,
    $addressRadix
  )

  $: physicalDisplayText = encodeForDisplay(
    $viewportData,
    $displayRadix,
    $bytesPerRow
  ).toUpperCase()

  //
  // reactive statements
  //

  $: {
    $editMode === EditByteModes.Single
      ? postEditorOnChangeMsg('hex')
      : postEditorOnChangeMsg($editorEncoding)

    // when the viewport is scrolled to the end, dispatch a 'scrolledToEnd' event
    if ($viewportScrolledToEnd && !$viewportScrolledToTop)
      eventDispatcher('scrolledToEnd')

    // when the viewport is scrolled to the top, dispatch a 'scrolledToTop' event
    if ($viewportScrolledToTop && !$viewportScrolledToEnd)
      eventDispatcher('scrolledToTop')
  }

  function encodeForDisplay(
    arr: Uint8Array,
    radix: number,
    bytes_per_row: number
  ): string {
    let result = ''
    if (arr.byteLength > 0) {
      const pad = radixBytePad(radix)
      let i = 0
      while (true) {
        for (let col = 0; i < arr.byteLength && col < bytes_per_row; ++col) {
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

  function makeAddressRange(
    start: number,
    end: number,
    stride: number,
    radix: number
  ): string {
    let i = start
    let result = (i * stride).toString(radix)
    for (++i; i < end; ++i) {
      result += '\n' + (i * stride).toString(radix)
    }

    return result
  }

  /**
   * Determine the number of lines displayed in the physical viewport
   */
  function calculateNumberOfLines() {
    $viewportLineHeight = parseFloat(
      getComputedStyle(viewportRefs.physical).lineHeight
    )
  }

  function scrollHandle(e: Event) {
    const element = e.target as HTMLElement

    // get the current scroll position of the viewport and the viewport geometry
    $viewportScrollTop = Math.ceil(element.scrollTop)
    $viewportScrollHeight = element.scrollHeight
    $viewportClientHeight = element.clientHeight

    // scroll the other view ports to the same position after a short delay (100ms)
    if (!currentScrollEvt || currentScrollEvt === element.id) {
      clearTimeout(scrollSyncTimer)
      currentScrollEvt = element.id
      switch (currentScrollEvt) {
        case 'physical':
          viewportRefs.logical.scrollTop = viewportRefs.physical.scrollTop
          viewportRefs.address.scrollTop = viewportRefs.physical.scrollTop
          break
        case 'logical':
          viewportRefs.physical.scrollTop = viewportRefs.address.scrollTop
          viewportRefs.address.scrollTop = viewportRefs.logical.scrollTop
          break
        case 'address':
          viewportRefs.physical.scrollTop = viewportRefs.address.scrollTop
          viewportRefs.logical.scrollTop = viewportRefs.address.scrollTop
          break
      }
      // noinspection TypeScriptValidateTypes
      scrollSyncTimer = setTimeout(() => (currentScrollEvt = null), 100)
    }
  }

  function setSelectedStoresFromEvent(event: Event) {
    const areaRef = event.currentTarget as HTMLTextAreaElement
    $focusedViewportId = areaRef.id

    const selectionFrame = frameSelectedOnWhitespace(areaRef, $displayRadix)
    selectionData.update((data) => {
      data.startOffset = selectionFrame.start
      data.endOffset = selectionFrame.end
      data.originalEndOffset = selectionFrame.end
      data.active = true
      return data
    })
  }

  function handleSelectionEvent(event: Event) {
    eventDispatcher('clearDataDisplays')
    setSelectedStoresFromEvent(event)
    updateEditorData(event as MouseEvent)
  }

  type SelectedFrameOffsets = {
    start: number
    end: number
  }

  function frameSelectedOnWhitespace(
    selected: HTMLTextAreaElement,
    radix: number
  ): SelectedFrameOffsets {
    let selectionStart = selected.selectionStart
    let selectionEnd = selected.selectionEnd
    if (selectionStart != undefined && selectionEnd != undefined) {
      if (
        isWhitespace(selected.value.at(selectionStart)) &&
        selectionStart % 2
      ) {
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

    const start =
      selected.id === 'logical'
        ? Math.floor(selectionStart / 2)
        : selectionOffsetsByRadix[radix].start

    const end =
      selected.id === 'logical'
        ? Math.floor(selectionEnd / 2)
        : selectionOffsetsByRadix[radix].end

    return { start, end }
  }

  function isWhitespace(c: string | undefined): boolean {
    return c ? ' \t\n\r\v'.indexOf(c) > -1 : false
  }

  function updateEditorData(event: MouseEvent) {
    editedDataSegment.update(() => {
      return Uint8Array.from(
        $viewportData.subarray(
          $selectionData.startOffset,
          $selectionData.endOffset + 1
        )
      )
    })

    if ($editMode === EditByteModes.Single) postEditorOnChangeMsg('hex')
    else postEditorOnChangeMsg($editorEncoding)
  }

  function postEditorOnChangeMsg(forcedEncoding?: string) {
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        fileOffset: $selectionData.startOffset,
        selectionData: $editedDataSegment,
        encoding: forcedEncoding ? forcedEncoding : $editorEncoding,
        selectionSize: $selectionSize,
        editMode: $editMode,
      },
    })
  }

  onMount(() => {
    calculateNumberOfLines()

    // recalculate number of lines when the window is resized
    window.addEventListener('resize', calculateNumberOfLines)
  })
</script>

<textarea
  class={$UIThemeCSSClass + ' address_vw'}
  class:locked={$selectionData.active}
  id="address"
  contenteditable="true"
  readonly
  bind:this={viewportRefs.address}
  bind:innerHTML={addressDisplayText}
  on:scroll={scrollHandle}
/>
<textarea
  class={$UIThemeCSSClass + ' physical'}
  class:locked={$selectionData.active}
  class:hexWidth={$displayRadix === RADIX_OPTIONS.Hexadecimal}
  class:decoctWidth={$displayRadix === RADIX_OPTIONS.Decimal ||
    $displayRadix === RADIX_OPTIONS.Octal}
  class:binWidth={$displayRadix === RADIX_OPTIONS.Binary}
  id="physical"
  contenteditable="true"
  readonly
  bind:this={viewportRefs.physical}
  bind:innerHTML={physicalDisplayText}
  on:mouseup={handleSelectionEvent}
  on:scroll={scrollHandle}
/>
<textarea
  class={$UIThemeCSSClass + ' logical'}
  class:locked={$selectionData.active}
  class:hexWidth={$displayRadix === RADIX_OPTIONS.Hexadecimal}
  class:decoctWidth={$displayRadix === RADIX_OPTIONS.Decimal ||
    $displayRadix === RADIX_OPTIONS.Octal}
  class:binWidth={$displayRadix === RADIX_OPTIONS.Binary}
  id="logical"
  contenteditable="true"
  readonly
  bind:this={viewportRefs.logical}
  bind:innerHTML={$viewportLogicalDisplayText}
  on:mouseup={handleSelectionEvent}
  on:scroll={scrollHandle}
/>

<style lang="scss">
  textarea {
    line-height: 1.2;
  }
  textarea.locked {
    overflow-y: hidden;
  }
  textarea.physical.hexWidth {
    min-width: 300pt;
  }
  textarea.logical.hexWidth {
    min-width: 200pt;
  }
  textarea.physical.decoctWidth {
    min-width: 385pt;
  }
  textarea.logical.decoctWidth {
    min-width: 200pt;
  }
  textarea.physical.binWidth {
    min-width: 435pt;
  }
  textarea.logical.binWidth {
    min-width: 100pt;
  }
</style>
