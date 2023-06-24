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
    bytesPerRow,
    displayRadix,
    editByteWindowHidden,
    editedDataSegment,
    editMode,
    editorEncoding,
    editorSelection,
    focusedViewportId,
    seekOffset,
    headerHidden,
    offsetMax,
    originalDataSegment,
    rawEditorSelectionTxt,
    requestable,
    selectionData,
    selectionSize,
    viewportCapacity,
    viewportEndOffset,
    viewportFollowingByteCount,
    viewportLineHeight,
    viewportNumLinesDisplayed,
    viewportStartOffset,
    editByte,
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
  import { writable } from 'svelte/store'
  import { enterKeypressEvents } from '../utilities/enterKeypressEvents'
  import {
    _viewportData,
    selectedByte,
    byteActionPxOffsets,
    mouseSelectionBytes,
    type EditByteEvent,
    type EditEvent,
    viewport,
    VIEWPORT_SCROLL_INCREMENT,
    ViewportData_t,
  } from './DataDisplays/CustomByteDisplay/BinaryData'

  import BinaryValue from './DataDisplays/CustomByteDisplay/BinaryValueDiv.svelte'
  import StoreDebug from './Debug/StoreDebug.svelte'

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

  function seek(offsetArg?: number) {
    if (!offsetArg) offsetArg = $seekOffset

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

    clearDataDisplays()
  }

  function scrolledToEnd(_: Event) {
    if ($viewportFollowingByteCount > 0) {
      // top the display must be the last page of the current viewport, plus one line
      const topOfLastPagePlusOneLine =
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
      seek(topOfLastPagePlusOneLine)
    }
  }

  function scrolledToTop(_: Event) {
    if ($viewportStartOffset > 0) {
      // offset to scroll to after the viewport is scrolled, which should be the previous line in the file
      const topOfFirstPageMinusOneLine = $viewportStartOffset - $bytesPerRow
      vscode.postMessage({
        command: MessageCommand.scrollViewport,
        data: {
          // scroll the viewport with the desired offset in the middle
          scrollOffset: Math.max(
            topOfFirstPageMinusOneLine - Math.floor($viewportCapacity / 2),
            0
          ),
          bytesPerRow: $bytesPerRow,
          numLinesDisplayed: $viewportNumLinesDisplayed,
        },
      })
      seek(topOfFirstPageMinusOneLine)
    }
  }

  function seekEventHandler(_: Event) {
    seek($seekOffset)
  }

  function handleEditorEvent(_: Event) {
    if ($selectionSize < 0) {
      clearDataDisplays()
      return
    }
    requestEditedData()
  }

  function custom_commit_changes(event: CustomEvent<EditEvent>) {
    const action = event.detail.action

    let editedData: Uint8Array
    let originalData = $originalDataSegment
    let editedOffset = $selectionData.startOffset

    // noinspection FallThroughInSwitchStatementJS
    switch (action) {
      case 'insert-after':
        ++editedOffset
      // intentional fallthrough
      case 'insert-before':
        originalData = new Uint8Array(0)
      case 'byte-input':
        editedData = $editedDataSegment.subarray(0, 1)
        break
      case 'insert-replace':
        editedData = $editedDataSegment
        break
      case 'delete':
        editedData = new Uint8Array(0)
        break
    }

    vscode.postMessage({
      command: MessageCommand.commit,
      data: {
        offset: editedOffset,
        originalSegment: originalData,
        editedSegment: editedData,
      },
    })
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

  function clearDataDisplays() {
    $selectionData.startOffset = 0
    $selectionData.endOffset = 0
    $selectionData.originalEndOffset = 0
    $selectionData.active = false
    $editorSelection = ''
    $editedDataSegment = new Uint8Array(0)
  }

  function handleKeyBind(event: Event) {
    const kbdEvent = event as KeyboardEvent
    if (kbdEvent.key === 'Enter') {
      enterKeypressEvents.run(document.activeElement.id)
      return
    }
    if ($editMode === EditByteModes.Multiple) return
    switch (kbdEvent.key) {
      case 'Escape':
        clearDataDisplays()
        return
    }
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
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

  function scrollBoundaryEventHandler(e: CustomEvent) {
    if (e.detail.scrolledTop) {
      scrolledToTop(e)
    }
    if (e.detail.scrolledEnd) {
      scrolledToEnd(e)
    }
  }
</script>

<svelte:window on:keydown|nonpassive={handleKeyBind} />
<body class={$UIThemeCSSClass}>
  <FlexContainer --height="150pt">
    <header>
      <FlexContainer --height="fit-content">
        <FileMetrics
          on:clearChangeStack={clearChangeStack}
          on:redo={redo}
          on:undo={undo}
        />
        <SearchReplace
          on:seek={seekEventHandler}
          on:clearDataDisplays={clearDataDisplays}
        />
        <Settings on:seek={seekEventHandler} />
      </FlexContainer>
    </header>
    {#if $headerHidden}
      <FlexContainer --justify-content="space-between" --align-items="center">
        <div class="filename-display">{$fileMetrics.name}</div>
        <button
          class={$UIThemeCSSClass + ' minmax-icon'}
          on:click={elementMinMax}
          >&<span class="material-symbols-outlined">expand_all</span></button
        >
      </FlexContainer>
    {:else}
      <div class="display-icons">
        <button
          class={$UIThemeCSSClass + ' minmax-icon'}
          on:click={elementMinMax}
          ><span class="material-symbols-outlined">collapse_all</span></button
        >
      </div>
    {/if}
  </FlexContainer>

  <Main
    on:clearDataDisplays={clearDataDisplays}
    on:commitChanges={custom_commit_changes}
    on:handleEditorEvent={handleEditorEvent}
    on:scrolledToTop={scrolledToTop}
    on:scrolledToEnd={scrolledToEnd}
    on:scrollBoundary={scrollBoundaryEventHandler}
  />

  <hr />
  <ServerMetrics />

  <FlexContainer --dir="row">
    <FlexContainer --dir="column" --width="50%">
      <h2>Debug</h2>
      <hr style="width: 50%;" />
      <StoreDebug name={'editorSelection'} store={editorSelection} />
      <StoreDebug name={'editByte'} store={editByte} />
      <StoreDebug name={'selectionData'} store={selectionData} />
      <StoreDebug name={'viewportData_t'} store={viewport} />
      <StoreDebug
        name={'editedDataSegment'}
        store={editedDataSegment}
        array={true}
      />
      <StoreDebug
        name={'originalDataSegment'}
        store={originalDataSegment}
        array={true}
      />
      <StoreDebug name={'selectedByte'} store={selectedByte} />
    </FlexContainer>
  </FlexContainer>
</body>

<!-- svelte-ignore css-unused-selector -->
<style lang="scss">
  div.test {
    display: flex;
    flex-wrap: wrap;
    width: 384px;
    height: 400pt;
    overflow-y: scroll;
  }
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
    font-family: var(--monospace-font);
    font-size: 14px;
    font-weight: bold;
  }

  /* fonts */
  main {
    font-family: var(--sans-serif-font);
    min-height: 100%;
  }

  header {
    display: flex;
    justify-content: center;
    width: 100%;
    max-height: 120pt;
    flex: 0 1 auto;
    transition: all 0.5s;
  }

  header div.display-icons {
    justify-content: space-between;
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

  button.minmax-icon {
    min-width: 14px;
    font-weight: bold;
  }
</style>
