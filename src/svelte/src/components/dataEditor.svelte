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
  import './globalStyles.css'
  import {
    addressRadix,
    bytesPerRow,
    displayRadix,
    editByteWindowHidden,
    editedDataSegment,
    editedDataStore,
    editorEncoding,
    editorSelection,
    focusedViewportId,
    gotoOffset,
    gotoOffsetInput,
    headerHidden,
    offsetMax,
    originalDataSegment,
    rawEditorSelectionTxt,
    requestable,
    selectionSize,
    viewportCapacity,
    viewportData,
    viewportEndOffset,
    viewportFollowingByteCount,
    viewportLength,
    viewportLineHeight,
    viewportLogicalDisplayText,
    viewportNumLinesDisplayed,
    viewportStartOffset,
  } from '../stores'
  import {
    CSSThemeClass,
    UIThemeCSSClass,
    darkUITheme,
  } from '../utilities/colorScheme'
  import {
    type ViewportReferences,
    viewport_references,
    radixBytePad,
  } from '../utilities/display'
  import { MessageCommand } from '../utilities/message'
  import { vscode } from '../utilities/vscode'
  import FileMetrics from './Header/fieldsets/FileMetrics.svelte'
  import { fileMetrics } from './Header/fieldsets/FileMetrics'
  import SearchReplace from './Header/fieldsets/SearchReplace.svelte'
  import Settings from './Header/fieldsets/Settings.svelte'
  import Main from './Main.svelte'
  import { EditByteModes } from '../stores/configuration'
  import FlexContainer from './layouts/FlexContainer.svelte'
  import ServerMetrics from './ServerMetrics/ServerMetrics.svelte'
  import { selectionData, editMode } from './Editors/DataEditor'
  import BinaryDataContainer from './DataDisplays/CustomByteDisplay/BinaryDisplayContainer.svelte'
  import { writable } from 'svelte/store'
  import { enterKeypressEvents } from '../utilities/enterKeypressEvents'
  import {
    _viewportData,
    selectedByte,
    type EditByteAction,
    byteActionPxOffsets,
  } from './DataDisplays/CustomByteDisplay/BinaryData'
  import LogicalDisplayContainer from './DataDisplays/CustomByteDisplay/LogicalDisplayContainer.svelte'
  import BinaryValueActions from './DataDisplays/CustomByteDisplay/BinaryValueActions.svelte'

  $: $gotoOffset = parseInt($gotoOffsetInput, $addressRadix)
  $: $rawEditorSelectionTxt = $editorSelection
  $: $UIThemeCSSClass = $darkUITheme ? CSSThemeClass.Dark : CSSThemeClass.Light

  function requestEditedData() {
    if ($requestable) {
      vscode.postMessage({
        command: MessageCommand.requestEditedData,
        data: {
          selectionToFileOffset: $selectionData.startOffset,
          editedContent: $rawEditorSelectionTxt,
          viewport: $focusedViewportId,
          selectionSize: $selectionSize,
          encoding: $editorEncoding,
          radix: $displayRadix,
          editMode: $editMode,
        },
      })
    }
  }

  function goTo(offsetArg?: number) {
    if (!offsetArg) offsetArg = $gotoOffset

    const offset =
      offsetArg > 0 && offsetArg < $offsetMax && offsetArg % $bytesPerRow === 0
        ? offsetArg + 1
        : offsetArg

    // make sure that the offset is within the loaded viewport
    if (offset < $viewportStartOffset || offset > $viewportEndOffset) {
      // NOTE: Scrolling the viewport will make the display bounce until it goes to the correct offset
      vscode.postMessage({
        command: MessageCommand.scrollViewport,
        data: {
          // scroll the viewport with the offset in the middle
          scrollOffset: Math.max(offset - Math.floor($viewportCapacity / 2), 0),
          bytesPerRow: $bytesPerRow,
          numLinesDisplayed: $viewportNumLinesDisplayed,
        },
      })
    }

    // relative offset from viewport start
    const relativeOffset = offset - $viewportStartOffset
    // relative line number from viewport start
    const relativeTargetLine = Math.floor(relativeOffset / $bytesPerRow)
    const scrollTop = relativeTargetLine * $viewportLineHeight
    const viewportRefs = viewport_references() as ViewportReferences
    if (viewportRefs.physical) {
      viewportRefs.physical.scrollTop = scrollTop
    }
    if (viewportRefs.logical) {
      viewportRefs.logical.scrollTop = scrollTop
    }
    if (viewportRefs.address) {
      viewportRefs.address.scrollTop = scrollTop
    }

    closeEditByteWindow()
    clearDataDisplays()
  }

  function scrolledToEnd(_: Event) {
    if ($viewportFollowingByteCount > 0) {
      // top the display must be the last page of the current viewport, plus one line
      const goToOffset =
        $viewportEndOffset +
        $bytesPerRow -
        $viewportNumLinesDisplayed * $bytesPerRow
      vscode.postMessage({
        command: MessageCommand.scrollViewport,
        data: {
          // scroll the viewport with the desired offset in the middle
          scrollOffset: $viewportEndOffset - Math.floor($viewportCapacity / 2),
          bytesPerRow: $bytesPerRow,
          numLinesDisplayed: $viewportNumLinesDisplayed,
        },
      })
      goTo(goToOffset)
    }
  }

  function scrolledToTop(_: Event) {
    if ($viewportStartOffset > 0) {
      // offset to scroll to after the viewport is scrolled, which should be the previous line in the file
      const goToOffset = $viewportStartOffset - $bytesPerRow
      vscode.postMessage({
        command: MessageCommand.scrollViewport,
        data: {
          // scroll the viewport with the desired offset in the middle
          scrollOffset: Math.max(
            goToOffset - Math.floor($viewportCapacity / 2),
            0
          ),
          bytesPerRow: $bytesPerRow,
          numLinesDisplayed: $viewportNumLinesDisplayed,
        },
      })
      goTo(goToOffset)
    }
  }

  function goToEventHandler(_: Event) {
    goTo($gotoOffset)
  }

  function latin1Undefined(charCode: number): boolean {
    return charCode < 32 || (charCode > 126 && charCode < 160)
  }

  function logicalDisplay(bytes: Uint8Array, bytesPerRow: number): string {
    const undefinedCharStandIn = String.fromCharCode(9617)
    let result = ''

    for (let i = 0, col = 0; i < bytes.length; ++i) {
      if (latin1Undefined(bytes[i])) {
        result += undefinedCharStandIn
      } else {
        const char = String.fromCharCode(bytes[i])
        result += char === '\n' ? ' ' : char
      }

      if (++col === bytesPerRow) {
        col = 0
        if (i < bytes.length) {
          result += '\n'
        }
      } else {
        result += ' '
      }
    }

    return result
  }

  function handleEditorEvent(_: Event) {
    if ($selectionSize < 0) {
      clearDataDisplays()
      return
    }
    requestEditedData()
  }
  function custom_commit_changes(event: CustomEvent) {
    const action = event.detail.action
    const byte = event.detail.byte

    let editedData: Uint8Array
    let editedOffset = $selectionData.startOffset
    let originalData = $originalDataSegment

    switch (action as EditByteAction) {
      case 'insert-after':
        ++editedOffset
      case 'insert-before':
        originalData = new Uint8Array(0)
      case 'byte-input':
        editedData = $editedDataSegment.subarray(0, 1)
        break
      case 'delete':
        editedData = new Uint8Array(0)
        break
    }
    $editedDataStore = editedData

    vscode.postMessage({
      command: MessageCommand.commit,
      data: {
        offset: editedOffset,
        originalSegment: originalData,
        editedSegment: editedData,
      },
    })
    closeEditByteWindow()
    clearDataDisplays()
  }

  function commitChanges(event: CustomEvent) {
    const commitEvent = event.detail as MouseEvent
    const buttonPressed = commitEvent.target as HTMLButtonElement

    let editedData: Uint8Array
    let editedOffset = $selectionData.startOffset
    let originalData = $originalDataSegment

    if ($editMode === EditByteModes.Multiple) {
      editedData = $editedDataSegment
    } else {
      switch (buttonPressed.id) {
        case 'insert-after':
          ++editedOffset // offset is 1 byte after this byte
        // intentional fall through
        case 'insert-before':
          originalData = new Uint8Array(0) // there is no original data for insert
        // intentional fall through
        case 'insert-replace':
          editedData = $editedDataSegment.subarray(0, 1) // 1 byte
          break
        case 'insert-delete':
          editedData = new Uint8Array(0) // there is no edited data for delete
          break
      }
    }
    $editedDataStore = editedData
    vscode.postMessage({
      command: MessageCommand.commit,
      data: {
        offset: editedOffset,
        originalSegment: originalData,
        editedSegment: editedData,
      },
    })
    closeEditByteWindow()
    clearDataDisplays()
  }

  function undo() {
    vscode.postMessage({
      command: MessageCommand.undo,
    })
  }

  function redo() {
    vscode.postMessage({
      command: MessageCommand.redo,
    })
  }

  function clearChangeStack() {
    vscode.postMessage({
      command: MessageCommand.clear,
    })
  }

  function elementMinMax(event: Event) {
    const button = event.target as HTMLButtonElement
    const headerTag = document.querySelector('.header-container') as HTMLElement
    if ($headerHidden) {
      button.style.transform = ''
      headerTag.style.display = 'flex'
      $headerHidden = false
    } else {
      const headerTag = document.querySelector(
        '.header-container'
      ) as HTMLElement
      headerTag.style.display = 'none'
      $headerHidden = true
    }
  }

  function closeEditByteWindow() {
    $editByteWindowHidden = true
  }

  function clearDataDisplays() {
    $selectionData.startOffset = 0
    $selectionData.endOffset = 0
    $selectionData.originalEndOffset = 0
    $selectionData.active = false
    $editorSelection = ''
    $editedDataSegment = new Uint8Array(0)
  }

  function handleKeybind(event: Event) {
    const kbdEvent = event as KeyboardEvent
    if (kbdEvent.key === 'Enter') {
      enterKeypressEvents.run(document.activeElement.id)
      return
    }
    if ($editMode === EditByteModes.Multiple) return
    switch (kbdEvent.key) {
      case 'Escape':
        closeEditByteWindow()
        clearDataDisplays()
        return
    }
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.viewportRefresh:
        // the viewport has been refreshed, so the editor views need to be updated
        $viewportData = msg.data.data.viewportData
        $_viewportData = msg.data.data.viewportData
        $viewportStartOffset = msg.data.data.viewportOffset
        $viewportLength = msg.data.data.viewportLength
        $viewportFollowingByteCount = msg.data.data.viewportFollowingByteCount
        $viewportCapacity = msg.data.data.viewportCapacity
        $gotoOffset = 0
        $viewportLogicalDisplayText = logicalDisplay(
          $viewportData,
          $bytesPerRow
        )
        break

      case MessageCommand.editorOnChange:
        if ($editMode === EditByteModes.Multiple)
          $editorSelection = msg.data.display
        break

      case MessageCommand.requestEditedData:
        $editorSelection = msg.data.data.dataDisplay
        if ($editMode === EditByteModes.Multiple) {
          $editedDataSegment = new Uint8Array(msg.data.data.data)
        } else {
          $editedDataSegment[0] = msg.data.data.data
        }
        $selectionData.endOffset =
          $selectionData.startOffset + $editedDataSegment.byteLength - 1
        break

      case MessageCommand.setUITheme:
        $darkUITheme = msg.data.theme === 2
        break
    }
  })
  let editByteWindowHide: boolean
  $: editByteWindowHide =
    $editMode === EditByteModes.Single ? $editByteWindowHidden : true

  const binaryDataStr = writable('')

  $: $binaryDataStr = encodeForDisplay(
    $viewportData,
    $displayRadix,
    $bytesPerRow
  ).toUpperCase()

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
  let selectionDataDebug
  let selectedByteDebug
  let actionPxOffsetsDebug = $byteActionPxOffsets
  $: {
    actionPxOffsetsDebug = $byteActionPxOffsets
  }
  $: selectionDataDebug = $selectionData
  $: selectedByteDebug = $selectedByte
</script>

<svelte:window on:keydown|nonpassive={handleKeybind} />
<body class={$UIThemeCSSClass}>
  <FlexContainer>
    <header class="header-container">
      <FlexContainer>
        <FileMetrics />
        <SearchReplace
          on:goTo={goToEventHandler}
          on:clearDataDisplays={clearDataDisplays}
        />
        <Settings on:goTo={goToEventHandler} />
      </FlexContainer>
    </header>
    {#if $headerHidden}
      <FlexContainer --justify-content="space-between" --align-items="center">
        <div class="filename-display">{$fileMetrics.name}</div>
        <button
          class={$UIThemeCSSClass + ' minmax-icon'}
          on:click={elementMinMax}>&#8691;</button
        >
      </FlexContainer>
    {:else}
      <div class="display-icons">
        <button
          class={$UIThemeCSSClass + ' minmax-icon'}
          on:click={elementMinMax}>&#8691;</button
        >
      </div>
    {/if}
  </FlexContainer>

  <Main
    on:clearDataDisplays={clearDataDisplays}
    on:clearChangeStack={clearChangeStack}
    on:commitChanges={commitChanges}
    on:redo={redo}
    on:undo={undo}
    on:handleEditorEvent={handleEditorEvent}
    on:scrolledToTop={scrolledToTop}
    on:scrolledToEnd={scrolledToEnd}
  />

  <hr />

  <ServerMetrics />
  <hr />

  <h2>Flexible Custom Div Box</h2>
  <FlexContainer --dir="row">
    <BinaryValueActions
      on:commitChanges={custom_commit_changes}
      on:handleEditorEvent={handleEditorEvent}
    />
    <BinaryDataContainer />
    <LogicalDisplayContainer />

    <FlexContainer --dir="column" --width="25%">
      <h3>Debug Section</h3>
      <div>
        <b>$selectionData:</b> (startOffset: {selectionDataDebug.startOffset},
        endOffset: {selectionDataDebug.endOffset}, originalEnd: {selectionDataDebug.originalEndOffset},
        active: {selectionDataDebug.active})
      </div>
      <div>
        <b>$selectedByte:</b> (text: {selectedByteDebug.text}, offset: {selectedByteDebug.offset},
        value: {selectedByteDebug.value})
      </div>
    </FlexContainer>
  </FlexContainer>
</body>

<!-- svelte-ignore css-unused-selector -->
<style lang="scss">
  /* CSS reset */
  *,
  *:before,
  *:after {
    box-sizing: inherit;
    margin: 0;
    padding: 0;
    font-weight: normal;
  }

  div.filename-display {
    font-family: var(--vscode-editor-font-family, 'monospace');
    font-size: large;
  }

  /* fonts */
  main {
    font-family: monospace;
    min-height: 100%;
  }

  header {
    display: flex;
    justify-content: center;
    width: 100%;
    max-height: 150pt;
    flex: 0 1 auto;
    transition: all 0.5s;
  }

  header div.display-icons {
    justify-content: space-between;
    margin-top: 5px;
    transition: all 0.4s ease 0s;
    align-items: center;
  }

  header div.display-icons div {
    margin-right: 10pt;
    font-size: 10pt;
    letter-spacing: 1pt;
  }

  header div.display-icons button {
    width: 20px;
    height: 20px;
    font-size: 15px;
    padding: 0;
    font-weight: normal;
    border-width: 1px;
  }
</style>
