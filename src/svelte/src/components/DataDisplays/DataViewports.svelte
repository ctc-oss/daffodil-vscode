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
    editMode,
    fileByteStart,
    fileByteEnd,
    bytesPerRow,
    addressValue,
    viewportData,
    displayRadix,
    selectionActive,
    selectionStartOffset,
    selectionOriginalEnd,
    selectionEndOffset,
    focusedViewportId,
    editedDataSegment,
    editorEncoding,
    selectionSize,
  } from '../../stores'
  import { UIThemeCSSClass } from '../../utilities/colorScheme'
  import {
    edit_byte_window_ref,
    encodeForDisplay,
    isWhitespace,
    makeAddressRange,
    radixBytePad,
    syncScroll,
    viewport_references,
    type ViewportReferences,
  } from '../../utilities/display'
  import { MessageCommand } from '../../utilities/message'
  import { createEventDispatcher } from 'svelte'
  import { editByteWindowHidden, editByte, editorSelection } from '../../stores'
  import { vscode } from '../../utilities/vscode'
  import { EditByteModes } from '../../stores/Configuration'

  const EventDispatcher = createEventDispatcher()

  let viewportRefs = viewport_references() as ViewportReferences
  let isScrolledToTop = true
  let isScrolledToEnd = false

  let currentScrollEvt: string | null, scrollSyncTimer: NodeJS.Timeout

  let editByteWindow = edit_byte_window_ref()

  let physicalDisplayText: string = ''
  let logicalDisplayText: string = ''

  $: addressText = makeAddressRange(
    $fileByteStart,
    $fileByteEnd,
    $bytesPerRow,
    $addressValue
  )
  $: {
    physicalDisplayText = encodeForDisplay(
      $viewportData,
      $displayRadix,
      $bytesPerRow
    ).toUpperCase()
  }
  $: {
    if (editByteWindow) change_edit_byte_window($displayRadix)
  }

  function scrollHandle(e: Event) {
    const element = e.target as HTMLElement
    isScrolledToTop = element.scrollTop === 0
    isScrolledToEnd =
      element.scrollTop >= element.scrollHeight - element.clientHeight
    if (!currentScrollEvt || currentScrollEvt === element.id) {
      clearTimeout(scrollSyncTimer)
      currentScrollEvt = element.id
      switch (currentScrollEvt) {
        case 'physical':
          syncScroll(viewportRefs.physical, viewportRefs.address)
          syncScroll(viewportRefs.physical, viewportRefs.logical)
          break
        case 'logical':
          syncScroll(viewportRefs.logical, viewportRefs.address)
          syncScroll(viewportRefs.logical, viewportRefs.physical)
          break
        case 'address':
          syncScroll(viewportRefs.address, viewportRefs.physical)
          syncScroll(viewportRefs.address, viewportRefs.logical)
          break
      }
      // noinspection TypeScriptValidateTypes
      scrollSyncTimer = setTimeout(function () {
        currentScrollEvt = null
      }, 100)
    }
  }

  function frameSelectedOnWhitespace(selected: HTMLTextAreaElement) {
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

    $selectionStartOffset =
      selected.id === 'logical'
        ? Math.floor(selectionStart / 2)
        : selectionOffsetsByRadix[$displayRadix].start

    $selectionEndOffset = $selectionOriginalEnd =
      selected.id === 'logical'
        ? Math.floor(selectionEnd / 2)
        : selectionOffsetsByRadix[$displayRadix].end

    $selectionActive = true
  }

  function focused_textarea_ref(event: Event): HTMLTextAreaElement {
    const areaRef = event.currentTarget as HTMLTextAreaElement
    frameSelectedOnWhitespace(areaRef)
    $focusedViewportId = areaRef.id
    return areaRef
  }

  function handleViewportClickEvent(event: Event) {
    EventDispatcher('clearDataDisplays')

    const areaRef = focused_textarea_ref(event)

    let selectionRangeValid: boolean
    $focusedViewportId === 'physical'
      ? (selectionRangeValid =
          areaRef.selectionEnd - areaRef.selectionStart ===
          radixBytePad($displayRadix))
      : (selectionRangeValid =
          areaRef.selectionEnd - areaRef.selectionStart === 1)

    editedDataSegment.update(() => {
      return Uint8Array.from(
        $viewportData.subarray($selectionStartOffset, $selectionStartOffset + 8)
      )
    })

    if ($editMode === EditByteModes.Single && selectionRangeValid) {
      change_edit_byte_window($displayRadix, event)
    }
  }

  function change_edit_byte_window(radix: number, event?: Event) {
    if (!editByteWindow) editByteWindow = edit_byte_window_ref()

    if (event) {
      const clickEvent = event as MouseEvent
      editByteWindow.style.left = (clickEvent.x - 5).toString() + 'px'
      editByteWindow.style.top = (clickEvent.y - 5).toString() + 'px'
    }

    if (radix === 2) {
      editByteWindow.style.width = '175pt'
    } else {
      editByteWindow.style.width = '100pt'
    }
    $editByteWindowHidden = false
    $editorSelection = $editByte
    document.getElementById('editByteInput').focus()
  }
  function handleSelectionEvent(event: Event) {
    EventDispatcher('clearDataDisplays')

    const areaRef = event.currentTarget as HTMLTextAreaElement
    frameSelectedOnWhitespace(areaRef)
    $focusedViewportId = areaRef.id
    editedDataSegment.update(() => {
      return Uint8Array.from(
        $viewportData.subarray($selectionStartOffset, $selectionEndOffset + 1)
      )
    })
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        fileOffset: $selectionStartOffset,
        selectionData: $editedDataSegment,
        encoding: $editorEncoding,
        selectionSize: $selectionSize,
      },
    })
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.updateLogicalDisplay:
        logicalDisplayText = msg.data.data.logicalDisplay
        break
    }
  })
  
</script>

<textarea
  class={$UIThemeCSSClass + ' address_vw'}
  class:locked={$selectionActive}
  id="address"
  contenteditable="true"
  readonly
  bind:this={viewportRefs.address}
  bind:innerHTML={addressText}
  on:scroll={scrollHandle}
/>
{#if $editMode === EditByteModes.Single}
  <textarea
    class={$UIThemeCSSClass + " physical"}
    class:locked={$selectionActive}
    id="physical"
    contenteditable="true"
    readonly
    bind:this={viewportRefs.physical}
    bind:innerHTML={physicalDisplayText}
    on:scroll={scrollHandle}
    on:click={handleViewportClickEvent}
  />
  <textarea
    class={$UIThemeCSSClass + " logical"}
    class:locked={$selectionActive}
    id="logical"
    contenteditable="true"
    readonly
    bind:this={viewportRefs.logical}
    bind:innerHTML={logicalDisplayText}
    on:scroll={scrollHandle}
    on:click={handleViewportClickEvent}
  />
{:else}
  <textarea
    class={$UIThemeCSSClass + " physical"}
    class:locked={$selectionActive}
    id="physical"
    contenteditable="true"
    readonly
    bind:this={viewportRefs.physical}
    bind:innerHTML={physicalDisplayText}
    on:select={handleSelectionEvent}
    on:scroll={scrollHandle}
  />
  <textarea
    class={$UIThemeCSSClass + " logical"}
    class:locked={$selectionActive}
    id="logical"
    contenteditable="true"
    readonly
    bind:this={viewportRefs.logical}
    bind:innerHTML={logicalDisplayText}
    on:select={handleSelectionEvent}
    on:scroll={scrollHandle}
  />
{/if}

<style lang="scss">
  textarea.locked {
    overflow-y: hidden;
  }
  textarea.physical {
    min-width: 300pt;
  }
  textarea.logical {
    min-width: 200pt;
  }
</style>
