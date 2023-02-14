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
    displayRadix,
    addressValue,
    filename,
    filetype,
    diskFileSize,
    fileByteStart,
    fileByteEnd,
    bytesPerRow,
    selectedFileData,
    selectionStartOffset,
    selectionEndOffset,
    editorSelection,
    editorEncoding,
    selectionSize,
    commitable,
    byteOffsetPos,
    cursorPos,
    dataViewEndianness,
    commitErrMsg,
    viewportData,
    gotoOffset,
    gotoOffsetMax,
    int8,
    uint8,
    int16,
    uint16,
    int32,
    uint32,
    float32,
    int64,
    uint64,
    float64,
    rawEditorSelectionTxt,
    asciiCount,
    searching,
    searchData,
    allowCaseInsensitiveSearch,
    searchCaseInsensitive,
    searchable,
    searchResults,
    replaceData,
    replaceable,
    replaceErrMsg,
    selectionOriginalEnd,
    searchErrMsg,
    computedFilesize,
    commitHash,
    diskHash,
    saveable,
    selectionHash,
    uneditedSelectionHash,
    requestable,
    undoCount,
    changeCount,
    editByte,
    editMode,
    editByteWindowHidden,
    focusedViewportId
  } from '../stores'
  import {
    radixOpt,
    encoding_groups,
    endiannessOpt,
    lsbOpt,
    byteSizeOpt,
    addressOpt,
    dvHighlightTag,
    getOffsetDisplay,
    encodeForDisplay,
    makeAddressRange,
    isWhitespace,
    syncScroll,
    setSelectionOffsetInfo,
    radixBytePad,
    isLatin1Editable
  } from '../utilities/display'
  import { vscode } from '../utilities/vscode'
  import { MessageCommand } from '../utilities/message'
  import { writable } from 'svelte/store'

  let addressText: string
  let physicalOffsetText: string
  let physicalDisplayText = ''
  let logicalOffsetText: string
  let logicalDisplayText = ''
  let currentScrollEvt: string | null, scrollSyncTimer: NodeJS.Timeout
  let physical_vwRef: HTMLTextAreaElement,
    address_vwRef: HTMLTextAreaElement,
    logical_vwRef: HTMLTextAreaElement

  const selectedContent = writable(
    document.getElementById('selectedContent') as HTMLDivElement
  )
  const editByteWindow = writable(
    document.getElementById('editByteWindow') as HTMLDivElement
  )

  // Reactive Declarations
  $: addressText = makeAddressRange(
    $fileByteStart,
    $fileByteEnd,
    $bytesPerRow,
    $addressValue
  )
  $: selectionOffsetText = setSelectionOffsetInfo(
    'Selection',
    $selectionStartOffset,
    $selectionEndOffset,
    $selectionSize
  )
  $: {
    physicalOffsetText = getOffsetDisplay($displayRadix, 'physical')
    logicalOffsetText = getOffsetDisplay($displayRadix, 'logical')
  }
  $: { 
    physicalDisplayText = encodeForDisplay(
      $viewportData,
      $displayRadix,
      $bytesPerRow
    ).toUpperCase()
  }
  $: setSelectionEncoding($editorEncoding)
  $: updateLogicalDisplay($bytesPerRow)
  $: goTo($gotoOffset)
  $: {
    if($editorSelection.includes(dvHighlightTag.start)) {
      $editorSelection = $editorSelection
        .replaceAll(dvHighlightTag.start, '')
        .replaceAll(dvHighlightTag.end, '')
    }
      $rawEditorSelectionTxt = $editorSelection

  }
  
  function requestEditedData() {
    if ($requestable) {
      vscode.postMessage({
        command: MessageCommand.requestEditedData,
        data: {
          selectionToFileOffset: $selectionStartOffset,
          editedContent: $rawEditorSelectionTxt,
          viewport: $focusedViewportId,
          selectionSize: $selectionSize,
          encoding: $editorEncoding,
          radix: $displayRadix,
          editMode: $editMode
        },
      })    
    }
  }

  function goTo(offset: number) {
    if (physical_vwRef) {
      const rowCount = Math.ceil($computedFilesize / $bytesPerRow)
      const lineHeight = physical_vwRef.scrollHeight / rowCount
      const targetLine = Math.ceil(offset / $bytesPerRow)
      physical_vwRef.scrollTop =
        (targetLine == 0 ? 0 : targetLine - 1) * lineHeight
    }
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

  function setSelectionEncoding(editorEncoding: string) {
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        encoding: editorEncoding,
        selectionData: $selectedFileData,
      },
    })
  }

  async function loadContent(data: Uint8Array) {
    $viewportData = data
    $gotoOffset = 0
    $gotoOffsetMax = data.length
    vscode.postMessage({
      command: MessageCommand.updateLogicalDisplay,
      data: {
        viewportData: $viewportData,
        bytesPerRow: $bytesPerRow,
      },
    })
  }

  function scrollHandle(e: Event) {
    let element = (e.target as HTMLElement).id
    if (!currentScrollEvt || currentScrollEvt === element) {
      clearTimeout(scrollSyncTimer)
      currentScrollEvt = element
      switch (currentScrollEvt) {
        case 'physical':
          syncScroll(physical_vwRef, address_vwRef)
          syncScroll(physical_vwRef, logical_vwRef)
          break
        case 'logical':
          syncScroll(logical_vwRef, address_vwRef)
          syncScroll(logical_vwRef, physical_vwRef)
          break
        case 'address':
          syncScroll(address_vwRef, physical_vwRef)
          syncScroll(address_vwRef, logical_vwRef)
          break
      }
      // noinspection TypeScriptValidateTypes
      scrollSyncTimer = setTimeout(function () {
        currentScrollEvt = null
      }, 100)
    }
  }

  async function handleEditorEvent(e: Event) {
    $cursorPos = document.getSelection().anchorOffset
    requestEditedData()
  }

  function frameSelected(selected: HTMLTextAreaElement) {
    let selectionStart = selected.selectionStart as number
    let selectionEnd = selected.selectionEnd as number

    if (selectionStart % 2 === 1) {
      ++selectionStart
    }
    if (selectionEnd % 2 === 0) {
      --selectionEnd
    }

    selected.selectionStart = selectionStart
    selected.selectionEnd = selectionEnd
    return selected
  }

  function frameSelectedOnWhitespace(selected: HTMLTextAreaElement) {
    let selectionStart = selected.selectionStart
    let selectionEnd = selected.selectionEnd
    if (selectionStart != undefined && selectionEnd != undefined) {
      if (isWhitespace(selected.value.at(selectionStart))) {
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
        start: selectionStart / 9,
        end: Math.floor((selectionEnd - 8) / 9 + 1),
      },
      8: {
        start: selectionStart / 4,
        end: Math.floor((selectionEnd - 3) / 4 + 1),
      },
      10: {
        start: selectionStart / 4,
        end: Math.floor((selectionEnd - 3) / 4 + 1),
      },
      16: {
        start: selectionStart / 3,
        end: Math.floor((selectionEnd - 2) / 3 + 1),
      },
    }

    selectionStartOffset.update(() => {
      return selected.id === 'logical'
        ? Math.floor(selectionStart / 2)
        : selectionOffsetsByRadix[$displayRadix].start
    })
    selectionEndOffset.update(() => {
      return selected.id === 'logical'
        ? Math.floor(selectionEnd / 2)
        : selectionOffsetsByRadix[$displayRadix].end
    })
    selectionOriginalEnd.update(() => {
      return selected.id === 'logical'
        ? Math.floor(selectionEnd / 2)
        : selectionOffsetsByRadix[$displayRadix].end
    })  
  }

  /**
   * @brief Handle Click vs Select in Viewport. Additional function was needed due to event propagation from textarea to 
   * editByteWindow causing another 'select' Event when closing the editByteWindow. Capture and cancelling event propagation
   * did not resolve due to not parent / child coupling.
  */
  function handleViewportClickEvent(event: Event) {
    clearDataDisplays()
    const areaRef = event.currentTarget as HTMLTextAreaElement
    frameSelectedOnWhitespace(areaRef)
    $focusedViewportId = areaRef.id
    let selectionRangeValid: boolean
    ($focusedViewportId === 'physical')
      ? selectionRangeValid = (areaRef.selectionEnd - areaRef.selectionStart === 1 * radixBytePad($displayRadix))
      : selectionRangeValid = (areaRef.selectionEnd - areaRef.selectionStart === 1)
    
    if($editMode === 'simple' && selectionRangeValid) {
      const clickEvent = event as MouseEvent
      const windowX = clickEvent.clientX
      const windowY = clickEvent.clientY
      $editByteWindow.style.left = (windowX + 2).toString() + 'px'
      $editByteWindow.style.top = (windowY + 2).toString() + 'px'
      $editByteWindow.style.display = "flex"

      if($displayRadix === 2){
        $editByteWindow.style.width = "150px"
      }
      else{
        $editByteWindow.style.width = "85px"
      }
      $editByteWindowHidden = false 
    }

    selectedFileData.update(() => {
      return Uint8Array.from(
        $viewportData.subarray($selectionStartOffset, $selectionStartOffset + 8)
      )
    })
  }

  function handleSelectionEvent(event: Event) {
    clearDataDisplays()
    const areaRef = event.currentTarget as HTMLTextAreaElement
    frameSelectedOnWhitespace(areaRef)
    $focusedViewportId = areaRef.id
    selectedFileData.update(() => {
      return Uint8Array.from(
        $viewportData.subarray($selectionStartOffset, $selectionEndOffset + 1)
      )
    })
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        fileOffset: $selectionStartOffset,
        selectionData: $selectedFileData,
        encoding: $editorEncoding,
        selectionSize: $selectionSize,
      },
    })
  }

  function enableAdvanced(enable: boolean) {
    const advanced_elements = document.getElementsByClassName('advanced')
    for (let i = 0; i < advanced_elements.length; ++i) {
      const el = advanced_elements[i] as HTMLElement
      el.hidden = !enable
    }
  }

  function commitChanges() {
    let data: Uint8Array
    let dataLen: number

    if($editMode === 'full') {
      data = $selectedFileData
      dataLen = $selectionOriginalEnd - $selectionStartOffset
    } else {
      ($rawEditorSelectionTxt.length === 0)
        ? data = $selectedFileData = new Uint8Array(0)
        : data = $selectedFileData.subarray(0, 1)
      dataLen = 0
    }
    vscode.postMessage({
      command: MessageCommand.commit,
      data: {
        selectionStart: $selectionStartOffset,
        selectionData: data,
        selectionDataLen: dataLen,
      },
    })
    closeEphemeralWindows()
  }

  function search() {
    vscode.postMessage({
      command: MessageCommand.search,
      data: {
        searchData: $searchData,
        caseInsensitive: $searchCaseInsensitive,
      },
    })
    $searching = true
  }

  function searchAndReplace() {
    vscode.postMessage({
      command: MessageCommand.searchAndReplace,
      data: {
        searchData: $searchData,
        caseInsensitive: $searchCaseInsensitive,
        replaceData: $replaceData,
      },
    })
  }

  function saveToDisk() {
    vscode.postMessage({
      command: MessageCommand.save
    })
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

  function clearDataViewHighlight(event: Event) {
    editorSelection.update((str) => {
      return str
        .replaceAll(dvHighlightTag.start, '')
        .replaceAll(dvHighlightTag.end, '')
    })
  }

  function getHighlightLenModifier(editorEncoding: string): 1 | 2 | 8 {
    switch (editorEncoding) {
      case 'hex':
        return 2
      case 'binary':
        return 8
      default:
        return 1
    }
  }

  function getHighlightByteOffset(
    eventId: string,
    highlightLenModifier: number
  ): number {
    switch (eventId) {
      case 'b8_dv':
        return highlightLenModifier
      case 'b16_dv':
        return 2 * highlightLenModifier
      case 'b32_dv':
        return 4 * highlightLenModifier
      case 'b64_dv':
        return 8 * highlightLenModifier
    }
  }

  function highlightDataView(event: Event) {
    const highlightLenModifier = getHighlightLenModifier($editorEncoding)
    const highlightByteOffset = getHighlightByteOffset(
      (event.target as HTMLElement).id,
      highlightLenModifier
    )
    const pos = $byteOffsetPos * highlightLenModifier

    editorSelection.update((str) => {
      const seg1 = str.substring(0, pos) + dvHighlightTag.start
      const seg2 =
        str.substring(pos, pos + highlightByteOffset) + dvHighlightTag.end
      const seg3 = str.substring(pos + highlightByteOffset)
      return seg1 + seg2 + seg3
    })
  }

  const headerHidden = writable(false)
  function elementMinMax(event: Event) {
    const button = event.target as HTMLButtonElement
    const headerTag = document.querySelector('.header-container') as HTMLDivElement
    if($headerHidden) {
      button.style.transform = ""
      headerTag.style.display = "flex"
      $headerHidden = false
    }
    else {
      button.style.transform = "rotate(180deg)"
      const headerTag = document.querySelector('.header-container') as HTMLDivElement
      headerTag.style.display = "none"
      $headerHidden = true
    }
  }

  function closeEphemeralWindows() {
    const windows = document.querySelectorAll('.ephemeral')
    windows.forEach((element => {
      const window = element as HTMLElement
      window.style.display = "none"
    }))
    clearDataDisplays()
  }

  function closeEditByteWindow() {
    $editByteWindow.style.display = "none"
    $editByteWindowHidden = true
    clearDataDisplays()
  }

  function clearDataDisplays() {
    $selectionStartOffset = 0 
    $selectionEndOffset = 0
    $editorSelection = ''
  }

  function handleKeybind(event: Event) {
    if($editMode === 'full') return
    const kevent = event as KeyboardEvent
    switch(kevent.key) {
      case 'Escape':
        closeEditByteWindow()
        return   
    }
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.viewportSubscribe:
        loadContent(msg.data.viewportData)
        break
      case MessageCommand.editorOnChange:
        $editorSelection = msg.data.display
        $uneditedSelectionHash = msg.data.selectionHash
        break
      case MessageCommand.requestEditedData:
        $editorSelection = msg.data.dataDisplay
        if($editMode === 'full') {
          $selectedFileData = new Uint8Array(msg.data.data)
        }
        else {
          $selectedFileData[0] = msg.data.data
        }

        $cursorPos = document.getSelection().anchorOffset
        $selectionEndOffset =
          $selectionStartOffset + $selectedFileData.byteLength - 1
        $selectionHash = msg.data.selectionEditHash
        break
      case MessageCommand.updateLogicalDisplay:
        logicalDisplayText = msg.data.data.logicalDisplay
        break
      case MessageCommand.fileInfo:
        if (typeof msg.data.data.filename !== 'undefined') {
          $filename = msg.data.data.filename
        }
        if (typeof msg.data.data.filetype !== 'undefined') {
          $filetype = msg.data.data.filetype
        }
        if (typeof msg.data.data.diskFileSize !== 'undefined') {
          $diskFileSize = msg.data.data.diskFileSize
        }
        if (typeof msg.data.data.computedFilesize !== 'undefined') {
          $computedFilesize = msg.data.data.computedFilesize
        }
        if (typeof msg.data.data.diskHash !== 'undefined') {
          $diskHash = msg.data.data.diskHash
        }
        if (typeof msg.data.data.commitHash !== 'undefined') {
          $commitHash = msg.data.data.commitHash
        }
        if (typeof msg.data.data.changeCount !== 'undefined') {
          $changeCount = msg.data.data.changeCount
        }
        if (typeof msg.data.data.undoCount !== 'undefined') {
          $undoCount = msg.data.data.undoCount
        }
        break
      case MessageCommand.search:
        $searchResults = msg.data.searchResults
        $searching = false
        break
    }
  })
</script>
<svelte:window on:keydown|nonpassive={handleKeybind}/>
<header>
  <div class="header-container">
    <fieldset class="box file-metrics">
      <legend>File Metrics</legend>
      <div class="grid-container-single-column">
        <label for="file_name" class="file-metrics">Path: </label><span class="x-hidden">{$filename}</span>
        <hr />
      </div>
      <div class="grid-container-single-column">
        <label for="file_type" class="file-metrics">Type: </label><span id="file_type">{$filetype}</span>
        <br /><label for="computed_byte_cnt" class="file-metrics">Computed File Size: </label><span id="computed_byte_cnt">{$computedFilesize}</span>
        <br /><label for="ascii_count" class="file-metrics">ASCII count: </label><span id="ascii_byte_cnt">{$asciiCount}</span>
        <hr />
      </div>
      <div class="grid-container-two-columns">
        <div class="grid-container-column">
          <label for="fhash" class="file-metrics">Disk Hash: </label><br />
          <label for="chash" class="file-metrics">Commit Hash: </label>
        </div>
        <div class="grid-container-column">
          <div class="x-hidden">{$diskHash}</div>
          <div class="x-hidden">{$commitHash}</div>
        </div>
        <br />
        <br />
      </div>
      <div>
      {#if $saveable}
        <button on:click={saveToDisk}>Save</button>
      {:else}
        <button disabled>Save</button>
      {/if}
      </div>
    </fieldset>
    <fieldset class="box">
      <legend>Offset</legend>
      <div class="goto_offset">
        <input
          type="number"
          id="goto_offset"
          min="0"
          max={$gotoOffsetMax}
          bind:value={$gotoOffset}
        />
      </div>
    </fieldset>
    <fieldset class="box">
      <legend>Radix</legend>
      <div class="radix">
        <select id="radix" bind:value={$displayRadix} on:change={closeEphemeralWindows}>
          {#each radixOpt as { name, value }}
            <option {value}>{name}</option>
          {/each}
        </select>
      </div>
    </fieldset>
    <fieldset class="box">
      <legend>Search</legend>
      <div class="search">
        Search:
        {#if $searchData.length > 0 && !$searchable}
          <span class="errMsg">{$searchErrMsg}</span>
        {/if}
        <input bind:value={$searchData} />
        <br />
        Replace:
        {#if $replaceData.length > 0 && !$replaceable}
          <span class="errMsg">{$replaceErrMsg}</span>
        {/if}
        <input bind:value={$replaceData} />
        <br />
        {#if !$searchable}
          <button id="search_btn" disabled>Search</button>
        {:else}
          <button id="search_btn" on:click={search}>Search</button>
        {/if}
        {#if !$replaceable}
          <button id="replace_btn" disabled>Replace</button>
        {:else}
          <button id="replace_btn" on:click={searchAndReplace}>Replace</button>
        {/if}
        {#if $allowCaseInsensitiveSearch}
          <label for="search_case_insensitive"
            >Case Insensitive
            <input
              type="checkbox"
              id="search_case_insensitive"
              bind:checked={$searchCaseInsensitive}
            />
          </label>
        {/if}
        {#if $searching}
          <sub>Searching...</sub>
        {:else if $searchResults.length > 0}
          <sub>{$searchResults.length} Results </sub>
        {/if}
      </div>
    </fieldset>
    <fieldset class="box">
      <legend>Misc</legend>
      <div class="grid-container-single-column">
        <label for="advanced_mode"
          >Advanced Mode:
          <input type="checkbox" id="advanced_mode" title="Under Construction" disabled />
        </label>
        <label for="edit_mode">
          Edit Mode:
          <select id="edit_mode" bind:value={$editMode} on:change={closeEphemeralWindows}>
            <option value="simple">Simple</option>
            <option value="full">Full</option>
          </select>
        </label>
      </div>
    </fieldset>    
  </div>
  <div class="display-icons">
    <button class="minmax-icon" on:click={elementMinMax}>&#8690;</button>
  </div>
</header>

<main class="dataEditor" id="data_editor">
  <div class="hd">Address</div>
  <div class="hd">Physical</div>
  <div class="hd">Logical</div>
  <div class="hd">Edit</div>
  <div class="measure" style="align-items: center;">
    <select
      class="address_type"
      id="address_numbering"
      bind:value={$addressValue}
    >
      {#each addressOpt as { name, value }}
        <option {value}>{name}</option>
      {/each}
    </select>
  </div>
  <div class="measure">
    <span id="physical_offsets">
      {@html physicalOffsetText}
    </span>
  </div>
  <div class="measure">
    <span id="logical_offsets">
      {@html logicalOffsetText}
    </span>
  </div>
  <div class="measure">
    {#if $editMode == 'full'}
    <div>
      <span id="selected_offsets">{selectionOffsetText}</span>
      {#if $cursorPos}
        <span> | cursor: {$cursorPos}</span>
      {/if}
      <span id="editor_offsets" />
    </div>
    {/if}
  </div>
  <div class="edit-byte-window ephemeral" id="editByteWindow" bind:this={$editByteWindow}>
    <input type="text" placeholder="{$editByte}" bind:value={$editorSelection} on:input={handleEditorEvent}/>
    {#if $commitable}
    <button class="submit" on:click={commitChanges}>✔</button>
    <button class="delete" disabled>✖</button>
    {:else}
    <button class="submit" disabled>✔</button>
    <button class="delete" on:click={commitChanges}>✖</button>
    {/if}
  </div>
  <textarea
    class="address_vw"
    id="address"
    contenteditable="true"
    readonly
    bind:this={address_vwRef}
    bind:innerHTML={addressText}
    on:scroll={scrollHandle}
  />
  {#if $editMode == 'simple'}
  <textarea
    class="physical_vw"
    id="physical"
    contenteditable="true"
    readonly
    bind:this={physical_vwRef}
    bind:innerHTML={physicalDisplayText}
    on:scroll={scrollHandle}
    on:click={handleViewportClickEvent}
  />
  <textarea
    class="logicalView"
    id="logical"
    contenteditable="true"
    readonly
    bind:this={logical_vwRef}
    bind:innerHTML={logicalDisplayText}
    on:scroll={scrollHandle}
    on:click={handleViewportClickEvent}
  />
  {:else}
    <textarea
    class="physical_vw"
    id="physical"
    contenteditable="true"
    readonly
    bind:this={physical_vwRef}
    bind:innerHTML={physicalDisplayText}
    on:select={handleSelectionEvent}
    on:scroll={scrollHandle}
  />
  <textarea
    class="logicalView"
    id="logical"
    contenteditable="true"
    readonly
    bind:this={logical_vwRef}
    bind:innerHTML={logicalDisplayText}
    on:select={handleSelectionEvent}
    on:scroll={scrollHandle}
  />
  {/if}
  <div class="editView" id="edit_view">
{#if $editMode == "full"}
    <div
      class="selectedContent"
      id="editor"
      contenteditable="true"
      bind:this={$selectedContent}
      bind:innerHTML={$editorSelection}
      on:keyup|nonpassive={handleEditorEvent}
      on:click={handleEditorEvent}
      on:input={handleEditorEvent}
    />
  {:else}
    <div
      class="selectedContent"
      id="editor"
    />
  {/if}
  <!-- Full Mode Content Controls -->
  {#if $editMode == 'full'}
    <fieldset class="box margin-top">
      <legend
        >Content Controls
        {#if !$commitable}
          <span class="errMsg">{$commitErrMsg}</span>
        {/if}
      </legend>
      <div class="contentControls" id="content_controls">
        <div class="grid-container-two-columns">
          <div class="grid-container-column">
          {#if $editMode == 'full'}
            {#if $commitable}
                <button id="commit_btn" on:click={commitChanges}
                  >Commit Changes</button
                >
            {:else}
                <button id="commit_btn" disabled>Commit Changes</button>
            {/if}
          {/if}
          <span>
          {#if $undoCount > 0}
            <button on:click={redo}>Redo ({$undoCount})</button>
          {:else}
            <button disabled>Redo</button>
          {/if}
          {#if $changeCount > 0}
            <button on:click={undo}>Undo ({$changeCount})</button>
          {:else}
            <button disabled>Undo</button>
          {/if}
          {#if $undoCount > 0 || $changeCount > 0}
            <button on:click={clearChangeStack}>Clear</button>
          {:else}
            <button disabled>Clear</button>
          {/if}
          </span>
          </div>
          <div class="grid-container-column">
            <button id="add_data_breakpoint_btn" title="Under Construction" disabled hidden>Set Breakpoint</button
            >
          </div>
        </div>
        <hr />
        <div class="grid-container-two-columns">
          <div class="grid-container-column">
            <div class="content-select-column">
              <div class="content-select-container">
                <label for="endianness"
                  >Endianness:
                  <select
                    class="content-select"
                    id="endianness"
                    bind:value={$dataViewEndianness}
                  >
                    {#each endiannessOpt as { name, value }}
                      <option {value}>{name}</option>
                    {/each}
                  </select>
                </label>
              </div>
              {#if $editMode == 'full'}
              <div class="content-select-container">
                <label for="edit_encoding"
                  >Encoding:
                  <select
                    class="content-select"
                    id="edit_encoding"
                    bind:value={$editorEncoding}
                  >
                    {#each encoding_groups as { group, encodings }}
                      <optgroup label={group}>
                        {#each encodings as { name, value }}
                          <option {value}>{name}</option>
                        {/each}
                      </optgroup>
                    {/each}
                  </select>
                </label>
              </div>
            {/if}
            </div>
            <div class="advanced" hidden>
              <label for="lsb"
                >Least significant bit:
                <select id="lsb">
                  {#each lsbOpt as { name, value }}
                    <option {value}>{name}</option>
                  {/each}
                </select>
              </label>
            </div>
            <div class="advanced" hidden>
              <label for="logical_byte_size"
                >Logical byte size:
                <select id="logical_byte_size">
                  {#each byteSizeOpt as { value }}
                    <option {value}>{value}</option>
                  {/each}
                </select>
              </label>
            </div>
          </div>
          <div class="grid-container-column">
            <div id="data_vw">
              &nbsp;Offset: <span id="offset_dv" contenteditable="true"
                >{$byteOffsetPos}</span
              >
              <span
                id="b8_dv"
                on:mouseenter={highlightDataView}
                on:mouseleave={clearDataViewHighlight}
              >
                <br /><label for="int8_dv"
                  >&nbsp;&nbsp;&nbsp;int8: <text-field
                    id="int8_dv"
                    contenteditable="true"
                    bind:textContent={$int8}
                  /></label
                >
                <br /><label for="uint8_dv"
                  >&nbsp;&nbsp;uint8: <text-field
                    id="uint8_dv"
                    contenteditable="true"
                    bind:textContent={$uint8}
                  /></label
                >
              </span>
              <span
                id="b16_dv"
                on:mouseenter={highlightDataView}
                on:mouseleave={clearDataViewHighlight}
              >
                <br /><label for="int16_dv"
                  >&nbsp;&nbsp;int16: <text-field
                    id="int16_dv"
                    contenteditable="true"
                    bind:textContent={$int16}
                  /></label
                >
                <br /><label for="uint16_dv"
                  >&nbsp;uint16: <text-field
                    id="uint16_dv"
                    contenteditable="true"
                    bind:textContent={$uint16}
                  /></label
                >
              </span>
              <span
                id="b32_dv"
                on:mouseenter={highlightDataView}
                on:mouseleave={clearDataViewHighlight}
              >
                <br /><label for="int32_dv"
                  >&nbsp;&nbsp;int32: <text-field
                    id="int32_dv"
                    contenteditable="true"
                    bind:textContent={$int32}
                  /></label
                >
                <br /><label for="uint32_dv"
                  >&nbsp;uint32: <text-field
                    id="uint32_dv"
                    contenteditable="true"
                    bind:textContent={$uint32}
                  /></label
                >
                <br /><label for="float32_dv"
                  >float32: <text-field
                    id="float32_dv"
                    contenteditable="true"
                    bind:textContent={$float32}
                  /></label
                >
              </span>
              <span
                id="b64_dv"
                on:mouseenter={highlightDataView}
                on:mouseleave={clearDataViewHighlight}
              >
                <br /><label for="int64_dv"
                  >&nbsp;&nbsp;int64: <text-field
                    id="int64_dv"
                    contenteditable="true"
                    bind:textContent={$int64}
                  /></label
                >
                <br /><label for="uint64_dv"
                  >&nbsp;uint64: <text-field
                    id="uint64_dv"
                    contenteditable="true"
                    bind:textContent={$uint64}
                  /></label
                >
                <br /><label for="float64_dv"
                  >float64: <text-field
                    id="float64_dv"
                    contenteditable="true"
                    bind:textContent={$float64}
                  /></label
                >
              </span>
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  <!-- Simple Mode Content Controls -->
  {:else} 
    <fieldset class="box margin-top">
      <legend
        >Content Controls
        {#if !$commitable}
          <span class="errMsg">{$commitErrMsg}</span>
        {/if}
      </legend>
      <div class="contentControls" id="content_controls">
        <div class="grid-container-two-columns">
          <div class="grid-container-column">
          <span>
          {#if $undoCount > 0}
            <button on:click={redo}>Redo ({$undoCount})</button>
          {:else}
            <button disabled>Redo</button>
          {/if}
          {#if $changeCount > 0}
            <button on:click={undo}>Undo ({$changeCount})</button>
          {:else}
            <button disabled>Undo</button>
          {/if}
          {#if $undoCount > 0 || $changeCount > 0}
            <button on:click={clearChangeStack}>Clear</button>
          {:else}
            <button disabled>Clear</button>
          {/if}
          </span>
          </div>
        </div>
        <hr />
        <div class="grid-container-single-column">
          <div class="grid-container-column">
            <div class="content-select-column">
              <div class="content-select-container">
                <label for="endianness"
                  >Endianness:
                  <select
                    id="endianness"
                    bind:value={$dataViewEndianness}
                  >
                    {#each endiannessOpt as { name, value }}
                      <option {value}>{name}</option>
                    {/each}
                  </select>
                </label>
              </div>
            </div>
            <div class="grid-container-column">
              <div id="data_vw">
                <span
                  id="b8_dv"
                >
                  <br /><label for="int8_dv"
                    >&nbsp;&nbsp;&nbsp;int8: <text-field
                      id="int8_dv"
                    />{$int8}</label
                  >
                  <br /><label for="uint8_dv"
                    >&nbsp;&nbsp;uint8: <text-field
                      id="uint8_dv"
                    />{$uint8}</label
                  >
                </span>
                <span
                  id="b16_dv"
                >
                  <br /><label for="int16_dv"
                    >&nbsp;&nbsp;int16: <text-field
                      id="int16_dv"
                    />{$int16}</label
                  >
                  <br /><label for="uint16_dv"
                    >&nbsp;uint16: <text-field
                      id="uint16_dv"
                    />{$uint16}</label
                  >
                </span>
                <span
                  id="b32_dv"
                >
                  <br /><label for="int32_dv"
                    >&nbsp;&nbsp;int32: <text-field
                      id="int32_dv"
                    />{$int32}</label
                  >
                  <br /><label for="uint32_dv"
                    >&nbsp;uint32: <text-field
                      id="uint32_dv"
                    />{$uint32}</label
                  >
                  <br /><label for="float32_dv"
                    >float32: <text-field
                      id="float32_dv"
                    />{$float32}</label
                  >
                </span>
                <span
                  id="b64_dv"
                >
                  <br /><label for="int64_dv"
                    >&nbsp;&nbsp;int64: <text-field
                      id="int64_dv"
                    />{$int64}</label
                  >
                  <br /><label for="uint64_dv"
                    >&nbsp;uint64: <text-field
                      id="uint64_dv"
                    />{$uint64}</label
                  >
                  <br /><label for="float64_dv"
                    >float64: <text-field
                      id="float64_dv"
                    />{$float64}</label
                  >
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  {/if}
  </div>
</main>
<hr />
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

  /* fonts */
  main {
    font-family: monospace;
    min-height: 100%;
  }

  legend {
    font-weight: bold;
  }

  header {
    display: flex;
    justify-content: center;
    width: 100%;
    flex: 0 1 auto;
    transition: all 0.5s;
  }

  header fieldset button {
    margin-right: 5px;
    margin-top: 10px;
  }

  header label.file-metrics {
    font-weight: bold;
  }

  header div.header-container {
    display:flex;
    justify-content: center;
    transition: all 0.5s
  }
  header div.display-icons {
    margin-top: 5px;
    transition: all 0.4s ease 0s;
  }
  header div.display-icons button{    
    width: 20px;
    height: 20px;
    font-size: 15px;
    padding: 0;
    font-weight: normal;
    border-color: white;
    border-width: 1px;
    background-color: #22272e;
  }

  header div.file-metrics span {
    font-weight: normal;
  }

  header div.grid-container-two-columns {
    display: flex;
    padding-top: 5px;
  }

  header div.grid-container-single-column {
    padding-top: 5px;
    width: 100%;
  }

  header div.grid-container-two-columns div.grid-container-column {
    width: 50%;
  }

  header div.grid-container-column {
    width: 100%;
  }

  fieldset {
    padding: 5px;
  }

  fieldset.file-metrics {
    max-width: 250px;
    min-width: 200px;
  }

  input,
  select {
    background-color: #3c3c3c;
    color: white;
    border-width: 0;
    padding-top: 2px;
    padding-bottom: 2px;
    font-weight: bold;
  }

  header input {
    padding-left: 5px;
    width: 95%;
  }

  textarea {
    color: inherit;
    background-color: inherit;
    font: inherit;
    resize: none;
    width: auto;
    border: 0;
  }

  button {
    padding: 5px;
    display: inline-block;
    border-radius: 4px;
    border-width: 0;
    background-color: #727272;
    color: #ffffff;
    font-weight: bold;
    margin-bottom: 5px;
    cursor: pointer;
  }

  button.submit {
    background: green;
  }
  button.delete {
    background: red;
  }
  button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    color: #3a3838;
  }

  .dataEditor {
    display: grid;
    /* I think this should be 32em instead of 19em for 32 characters, but that didn't work */
    grid-template-columns: max-content max-content max-content auto;
    grid-template-rows: max-content max-content auto;
    gap: 1px;
    overflow: auto;
    min-height: 640px;
    height: 100%;
    font-family: monospace;
  }

  /* display of binary encoded data takes more space in the physical view */
  .dataEditor.binary {
    /* I think this should be 16em instead of 10em for 16 characters, but that didn't work */
    grid-template-columns: max-content max-content 10em auto;
  }

  .dataEditor div {
    resize: none;
  }


  .dataEditor div.hd {
    background: #767676;
    text-align: center;
    font-weight: bold;
  }

  .dataEditor div.measure {
    display: flex;
  }

  .dataEditor div.measure span {
    align-self: flex-end;
  }

  .dataEditor div.contentControls .grid-container-two-columns {
    display: flex;
  }

  .dataEditor
    div.contentControls
    .grid-container-two-columns
    div.grid-container-column {
    width: 50%;
    padding: 5px;
  }

  .dataEditor div.content-select-column {
    width: 50%;
  }

  .dataEditor div.content-select-container {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }

  .dataEditor div.content-select-container label {
    width: 100%;
  }

  .dataEditor div.edit-byte-window {
    width: 60px;
    height: 20px;
    display: none;
    position: absolute;
    transition: all 0.1s;
  }

  .dataEditor div.edit-byte-window input{
    width: 100%;
    border-width: 1px;
    border-color: white;
  }

  .dataEditor div.edit-byte-window button{
    padding: 0;
    margin: 0;
    height: 100%;
    width: 40px;
  }
  
  .dataEditor textarea {
    display: block;
    word-break: break-all;
    white-space: break-spaces;
    box-sizing: content-box;
    height: 100%;
    width: 100%;
  }

  .dataEditor textarea.address_vw {
    text-align: right;
    direction: rtl;
    user-select: none;
    cursor: not-allowed;
    pointer-events: none;
    max-width: 100px;
  }

  .dataEditor textarea.physical_vw {
    background: #4c4c4c;
  }

  .dataEditor textarea.logicalView {
    background: #3c3c3c;
  }

  .dataEditor div.editView {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr max-content;
    overflow-x: hidden;
    word-break: break-all;
  }

  .dataEditor div.selectedContent {
    background: #2c2c2c;
  }

  .dataEditor button {
    padding: 10px;
    margin-right: 5px;
    transition: all 0.5s;
  }

  .dataEditor select.content-select {
    float: right;
    max-width: 110px;
  }

  .grid-container-two-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .errMsg {
    color: red;
    max-width: 95%;
  }

  .warningMsg {
    color: yellow;
    max-width: 95%;
  }

  .margin-top {
    margin-top: 5px;
  }

  .search {
    min-width: 250px;
    max-width: 250px;
  }

  .x-hidden {
    overflow-x: hidden;
  }

  #address_numbering {
    min-width: 100%;
  }
</style>
