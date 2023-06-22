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
    addressRadix,
    bytesPerRow,
    displayRadix,
    editMode,
    editedDataSegment,
    editorEncoding,
    focusedViewportId,
    selectionData,
    selectionSize,
    viewportClientHeight,
    viewportData,
    viewportEndOffset,
    viewportLineHeight,
    viewportScrollHeight,
    viewportScrollTop,
    viewportScrolledToEnd,
    viewportScrolledToTop,
    viewportStartOffset,
    viewportLength,
  } from '../../stores'
  import { UIThemeCSSClass } from '../../utilities/colorScheme'
  import {
    radixBytePad,
    viewport_references,
    type ViewportReferences,
  } from '../../utilities/display'
  import { MessageCommand } from '../../utilities/message'
  import { createEventDispatcher, onMount, tick } from 'svelte'
  import { vscode } from '../../utilities/vscode'
  import { EditByteModes } from '../../stores/configuration'
  import BinaryValueActions from './CustomByteDisplay/BinaryValueActions.svelte'
  import ByteViewports from './ByteViewports.svelte'
  import {
    _viewportData,
    processingViewportRefresh,
    viewportData_t,
  } from './CustomByteDisplay/BinaryData'

  const eventDispatcher = createEventDispatcher()
  const viewportRefs = viewport_references() as ViewportReferences

  let currentScrollEvt: string | null, scrollSyncTimer: NodeJS.Timeout

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
    // if ($viewportScrolledToEnd && !$viewportScrolledToTop && !processingViewportRefresh)
    //   eventDispatcher('scrolledToEnd')

    // // when the viewport is scrolled to the top, dispatch a 'scrolledToTop' event
    // if ($viewportScrolledToTop && !$viewportScrolledToEnd && !processingViewportRefresh){
    //   eventDispatcher('scrolledToTop')
    // }

    // when the viewport length changes, update the viewport geometry
    if ($viewportLength >= 0) {
      populateViewportGeometry()
    }
  }

  function boundary_trigger_handle(event: CustomEvent) {
    console.log(event.detail)
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

  /**
   * Create a string of addresses for the address display
   * @param start start address
   * @param end end address
   * @param stride number of bytes per row
   * @param radix radix to use for the address display
   */
  function makeAddressRange(
    start: number,
    end: number,
    stride: number,
    radix: number
  ): string {
    const numLines = Math.ceil((end - start) / stride)
    let i = start
    let result = (i * stride).toString(radix)
    for (++i; i < numLines; ++i) {
      result += '\n' + (i * stride).toString(radix)
    }

    return result
  }

  function populateViewportGeometry() {
    // event handlers expect synchronous functions, so wrap the async function in a sync function
    async function populateViewportGeometryOps_() {
      if (viewportRefs.physical) {
        // wait for the DOM to be updated before getting the viewport geometry
        await tick()
        $viewportScrollTop = viewportRefs.physical.scrollTop
        $viewportScrollHeight = viewportRefs.physical.scrollHeight
        $viewportClientHeight = viewportRefs.physical.clientHeight
        $viewportLineHeight = parseFloat(
          getComputedStyle(viewportRefs.physical).lineHeight
        )
      }
    }

    populateViewportGeometryOps_()
  }

  function scrollHandle(e: Event) {
    const element = e.target as HTMLElement

    // get the current scroll position of the viewport and the viewport geometry
    $viewportScrollTop = element.scrollTop
    $viewportScrollHeight = element.scrollHeight
    $viewportClientHeight = element.clientHeight

    // scroll the other view ports to the same position after a short delay (100ms)
    if (!currentScrollEvt || currentScrollEvt === element.id) {
      clearTimeout(scrollSyncTimer)
      currentScrollEvt = element.id
      switch (element.id) {
        case 'physical':
          viewportRefs.logical.scrollTop = $viewportScrollTop
          viewportRefs.address.scrollTop = $viewportScrollTop
          break
        case 'logical':
          viewportRefs.physical.scrollTop = $viewportScrollTop
          viewportRefs.address.scrollTop = $viewportScrollTop
          break
        case 'address':
          viewportRefs.physical.scrollTop = $viewportScrollTop
          viewportRefs.logical.scrollTop = $viewportScrollTop
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

  function updateEditorData(_: MouseEvent) {
    editedDataSegment.update(() => {
      return Uint8Array.from(
        $viewportData.subarray(
          $selectionData.startOffset,
          $selectionData.endOffset + 1
        )
      )
    })
    postEditorOnChangeMsg(
      $editMode === EditByteModes.Single ? 'hex' : $editorEncoding
    )
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
    populateViewportGeometry()

    // recalculate the viewport geometry when the window is resized
    window.addEventListener('resize', populateViewportGeometry)
  })
</script>

<BinaryValueActions on:commitChanges on:handleEditorEvent />

<ByteViewports
  viewportData={$viewportData_t}
  addressRadix={$addressRadix}
  displayRadix={$displayRadix}
  bytesPerRow={$bytesPerRow}
  byteData={$_viewportData}
  bind:startOffset={$viewportStartOffset}
  on:scrollBoundary={boundary_trigger_handle}
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
