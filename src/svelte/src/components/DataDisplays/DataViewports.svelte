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
    fileByteStart,
    fileByteEnd,
    bytesPerRow,
    addressValue,
    viewportData,
    displayRadix,
    focusedViewportId,
    editedDataSegment,
    editorEncoding,
    selectionSize,
    viewportScrolledToTop,
    viewportScrolledToEnd,
    viewportScrollTop,
    viewportScrollHeight,
    viewportClientHeight,
    viewportNumLines,
  } from '../../stores'
  import { UIThemeCSSClass } from '../../utilities/colorScheme'
  import {
    edit_byte_window_ref,
    encodeForDisplay,
    makeAddressRange,
    syncScroll,
    viewport_references,
    type ViewportReferences,
  } from '../../utilities/display'
  import { MessageCommand } from '../../utilities/message'
  import { createEventDispatcher, onMount } from 'svelte'
  import { editByteWindowHidden } from '../../stores'
  import { vscode } from '../../utilities/vscode'
  import { EditByteModes, RadixOptions } from '../../stores/Configuration'
  import { frame_selected_on_whitespace } from './DataViewports'
  import { selectionData, editMode } from '../Editors/DataEditor'

  const EventDispatcher = createEventDispatcher()

  let viewportRefs = viewport_references() as ViewportReferences
  let currentScrollEvt: string | null, scrollSyncTimer: NodeJS.Timeout
  let editByteWindow = edit_byte_window_ref()
  let physicalDisplayText: string = ''
  let logicalDisplayText: string = ''

  $: {
    $editMode === EditByteModes.Single
      ? post_editorOnChange_msg('hex')
      : post_editorOnChange_msg($editorEncoding)
  }

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

  /**
   * Determine the number of lines displayed in the physical viewport
   */
  function calculateNumberOfLines() {
    const lineHeight = parseFloat(
      getComputedStyle(viewportRefs.physical).lineHeight
    )
    $viewportNumLines =
      Math.floor(viewportRefs.physical.scrollHeight / lineHeight) -
      Math.floor(viewportRefs.physical.clientHeight / lineHeight) +
      1
  }

  function scrollHandle(e: Event) {
    const element = e.target as HTMLElement
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
    $viewportScrollTop = Math.ceil(element.scrollTop)
    $viewportScrollHeight = element.scrollHeight
    $viewportClientHeight = element.clientHeight

    if ($viewportScrolledToEnd) {
      EventDispatcher('scrolledToEnd')
    } else if ($viewportScrolledToTop) {
      EventDispatcher('scrolledToTop')
    }
  }

  function set_selected_stores_from_event(event: Event) {
    const areaRef = event.currentTarget as HTMLTextAreaElement
    $focusedViewportId = areaRef.id

    let selectionFrame = frame_selected_on_whitespace(
      areaRef,
      $displayRadix,
      $selectionData.originalEndOffset
    )
    selectionData.update((data) => {
      data.startOffset = selectionFrame.start
      data.endOffset = selectionFrame.end
      data.originalEndOffset = selectionFrame.end
      data.active = true
      return data
    })
  }

  function change_edit_byte_window(radix: number, event?: MouseEvent) {
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
    // $editorSelection = $editByte
    document.getElementById('editByteInput').focus()
  }

  function handleSelectionEvent(event: Event) {
    EventDispatcher('clearDataDisplays')
    set_selected_stores_from_event(event)
    update_editor_data(event as MouseEvent)
  }

  function update_editor_data(event: MouseEvent) {
    editedDataSegment.update(() => {
      return Uint8Array.from(
        $viewportData.subarray(
          $selectionData.startOffset,
          $selectionData.endOffset + 1
        )
      )
    })

    if ($editMode === EditByteModes.Single) {
      post_editorOnChange_msg('hex')
      change_edit_byte_window($displayRadix, event)
    } else post_editorOnChange_msg($editorEncoding)
  }

  function post_editorOnChange_msg(forcedEncoding?: string) {
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

    // recalculate number of lines when the textarea content changes
    viewportRefs.physical.addEventListener('input', calculateNumberOfLines)

      // recalculate number of lines when the window is resized
    window.addEventListener('resize', calculateNumberOfLines)

    window.addEventListener('message', (msg) => {
      switch (msg.data.command) {
        case MessageCommand.updateLogicalDisplay:
          logicalDisplayText = msg.data.data.logicalDisplay
          break
        default:
          console.error('Unknown message command: ' + msg.data.command)
          break
      }
    })
  })
</script>

<textarea
  class={$UIThemeCSSClass + ' address_vw'}
  class:locked={$selectionData.active}
  id="address"
  contenteditable="true"
  readonly
  bind:this={viewportRefs.address}
  bind:innerHTML={addressText}
  on:scroll={scrollHandle}
/>
<textarea
  class={$UIThemeCSSClass + ' physical'}
  class:locked={$selectionData.active}
  class:hexWidth={$displayRadix === RadixOptions.Hexidecimal}
  class:decoctWidth={$displayRadix === RadixOptions.Decimal ||
    $displayRadix === RadixOptions.Octal}
  class:binWidth={$displayRadix === RadixOptions.Binary}
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
  class:hexWidth={$displayRadix === RadixOptions.Hexidecimal}
  class:decoctWidth={$displayRadix === RadixOptions.Decimal ||
    $displayRadix === RadixOptions.Octal}
  class:binWidth={$displayRadix === RadixOptions.Binary}
  id="logical"
  contenteditable="true"
  readonly
  bind:this={viewportRefs.logical}
  bind:innerHTML={logicalDisplayText}
  on:mouseup={handleSelectionEvent}
  on:scroll={scrollHandle}
/>

<style lang="scss">
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
