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
    addressValue,
    bytesPerRow,
    cursorPos,
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
    originalDataSegment,
    rawEditorSelectionTxt,
    requestable,
    selectionSize,
    viewportData,
    viewportFollowingByteCount,
    viewportLength,
    viewportOffset,
  } from '../stores'
  import {
    CSSThemeClass,
    UIThemeCSSClass,
    darkUITheme,
  } from '../utilities/colorScheme'
  import {
    type ViewportReferences,
    viewport_references,
  } from '../utilities/display'
  import { MessageCommand } from '../utilities/message'
  import { vscode } from '../utilities/vscode'
  import FileMetrics from './Header/fieldsets/FileMetrics.svelte'
  import { fileMetrics } from './Header/fieldsets/FileMetrics'
  import SearchReplace from './Header/fieldsets/SearchReplace.svelte'
  import Settings from './Header/fieldsets/Settings.svelte'
  import Main from './Main.svelte'
  import {
    EditByteModes,
    enterKeypressEventList,
  } from '../stores/Configuration'
  import Ephemeral from './layouts/Ephemeral.svelte'
  import EditByteWindow from './DataDisplays/EditByteWindow.svelte'
  import FlexContainer from './layouts/FlexContainer.svelte'
  import ServerMetrics from './ServerMetrics/ServerMetrics.svelte'
  import { selectionData, editMode } from './Editors/DataEditor'
  import BinaryDataContainer from './DataDisplays/CustomByteDisplay/BinaryDataContainer.svelte'

  $: updateLogicalDisplay($bytesPerRow)
  $: $gotoOffset = parseInt($gotoOffsetInput, $addressValue)
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
      offsetArg > 0 &&
      offsetArg < $fileMetrics.computedSize &&
      offsetArg % $bytesPerRow === 0
        ? offsetArg + 1
        : offsetArg

    let viewportRefs = viewport_references() as ViewportReferences
    if (viewportRefs.physical) {
      const rowCount = Math.ceil($fileMetrics.computedSize / $bytesPerRow)
      const lineHeight = viewportRefs.physical.scrollHeight / rowCount
      const targetLine = Math.ceil(offset / $bytesPerRow)
      viewportRefs.physical.scrollTop =
        (targetLine == 0 ? 0 : targetLine - 1) * lineHeight
    }
    closeEditByteWindow()
    clearDataDisplays()
  }

  function goToEventHandler(_: Event) {
    goTo($gotoOffset)
  }

  function updateLogicalDisplay(bytesPerRow) {
    vscode.postMessage({
      command: MessageCommand.updateLogicalDisplay,
      data: {
        viewportData: $viewportData,
        bytesPerRow: bytesPerRow,
      },
    })
  }

  function handleEditorEvent(_: Event) {
    if ($selectionSize < 0) {
      clearDataDisplays()
      return
    }

    $cursorPos = document.getSelection().anchorOffset
    requestEditedData()
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

  function scrolledToEnd(_: Event) {
    bytesPerRow
    vscode.postMessage({
      command: MessageCommand.scrollViewport,
      data: {
        scrollOffset: 10240 / 2,
        bytesPerRow: $bytesPerRow,
      },
    })
  }

  function scrolledToTop(_: Event) {
    vscode.postMessage({
      command: MessageCommand.scrollViewport,
      data: {
        scrollOffset: 0,
        bytesPerRow: $bytesPerRow,
      },
    })
  }

  function closeEditByteWindow() {
    $editByteWindowHidden = true
  }

  function clearDataDisplays() {
    $selectionData.startOffset = 0
    $selectionData.endOffset = 0
    $selectionData.originalEndOffset = 0
    $selectionData.active = false
    $cursorPos = 0
    $editorSelection = ''
    $editedDataSegment = new Uint8Array(0)
  }

  function handleKeybind(event: Event) {
    const kevent = event as KeyboardEvent
    if (kevent.key === 'Enter') {
      enterKeypressEventList.run(document.activeElement.id)
      return
    }
    if ($editMode === EditByteModes.Multiple) return
    switch (kevent.key) {
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
        $viewportOffset = msg.data.data.viewportOffset
        $viewportLength = msg.data.data.viewportLength
        $viewportFollowingByteCount = msg.data.data.viewportFollowingByteCount
        $gotoOffset = 0
        updateLogicalDisplay($bytesPerRow)
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
        $cursorPos = document.getSelection().anchorOffset
        $selectionData.endOffset =
          $selectionData.startOffset + $editedDataSegment.byteLength - 1
        break

      case MessageCommand.setUITheme:
        $darkUITheme = msg.data.theme === 2
        break

      default:
        console.error('Unknown message command: ' + msg.data.command)
        break
    }
  })
  let editByteWindowHide: boolean
  $: editByteWindowHide =
    $editMode === EditByteModes.Single ? $editByteWindowHidden : true
</script>

<svelte:window on:keydown|nonpassive={handleKeybind} />
<body class={$UIThemeCSSClass}>
  <Ephemeral anchorId="edit-byte-window" hideWhen={editByteWindowHide}>
    <EditByteWindow
      on:commitChanges={commitChanges}
      on:moveEditByteWindow
      on:handleEditorEvent={handleEditorEvent}
    />
  </Ephemeral>

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
  <details><summary>Flexible Custom Div Box</summary>
  <BinaryDataContainer binaryDataStr={"000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"} />
  </details>
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
