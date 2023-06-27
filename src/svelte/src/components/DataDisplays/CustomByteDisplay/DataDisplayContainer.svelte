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
    editedDataSegment,
    editorEncoding,
    focusedViewportId,
    selectionData,
    selectionSize,
    viewportScrollTop,
  } from '../../../stores'
  import { EditByteModes } from '../../../stores/configuration'
  import { MessageCommand } from '../../../utilities/message'
  import { vscode } from '../../../utilities/vscode'
  import {
    null_byte,
    type ByteSelectionEvent,
    type DisplayDataTypes,
    selectedByte,
    update_byte_action_offsets,
    BYTE_VALUE_DIV_OFFSET,
    ViewportDataStore_t,
    ViewportData_t,
    type ByteValue,
  } from './BinaryData'
  import BinaryValueDiv from './BinaryValueDiv.svelte'
  import LogicalValueDiv from './LogicalValueDiv.svelte'

  export let dataType: DisplayDataTypes
  export let bytesPerRow: number
  export let viewport: ViewportDataStore_t

  let viewportDisplay: ByteValue[]
  $: {
    viewportDisplay = viewport
      .physical_byte_values(16, 16)
      .slice($viewport.fileOffset, $viewport.fileOffset + 320)
  }
  const rowNumber = 20

  function mousedown(event: CustomEvent<ByteSelectionEvent>) {
    selectionData.update((selections) => {
      selections.active = false
      selections.startOffset = event.detail.targetByte.offset
      selections.endOffset = -1
      selections.originalEndOffset = -1
      return selections
    })
  }

  function mouseup(event: CustomEvent<ByteSelectionEvent>) {
    selectionData.update((selections) => {
      selections.active = true
      selections.endOffset = event.detail.targetByte.offset
      selections.originalEndOffset = event.detail.targetByte.offset
      adjust_event_offsets()
      return selections
    })

    set_byte_selection(event.detail)
  }

  function adjust_event_offsets() {
    const start = $selectionData.startOffset
    const end = $selectionData.endOffset

    if (start > end) {
      $selectionData.startOffset = end
      $selectionData.originalEndOffset = start
      $selectionData.endOffset = start
    }
  }

  function set_byte_selection(selectionEvent: ByteSelectionEvent) {
    $focusedViewportId = 'physical'

    $selectedByte =
      $editMode === EditByteModes.Single
        ? selectionEvent.targetByte
        : null_byte()

    update_byte_action_offsets(selectionEvent.targetElement, $viewportScrollTop)

    editedDataSegment.update(() => {
      return viewport.slice(
        $selectionData.startOffset,
        $selectionData.endOffset + 1
      )
    })

    $editMode === EditByteModes.Single
      ? postEditorOnChangeMsg('hex')
      : postEditorOnChangeMsg()
  }

  function postEditorOnChangeMsg(forcedEncoding?: string) {
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        fileOffset: $selectionData.startOffset + $viewport.fileOffset,
        selectionData: $editedDataSegment,
        encoding: forcedEncoding ? forcedEncoding : $editorEncoding,
        selectionSize: $selectionSize,
        editMode: $editMode,
      },
    })
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  id={dataType}
  class="byte-container hide-scrollbar {dataType}"
  class:locked={$selectionData.active}
  style="width: calc({bytesPerRow} * {BYTE_VALUE_DIV_OFFSET}px);"
>
  {#if dataType === 'physical'}
    {#key $viewport}
      {#each viewportDisplay as byte}
        <BinaryValueDiv {byte} on:mouseup={mouseup} on:mousedown={mousedown} />
      {/each}
    {/key}
  {:else}
    {#key $viewport}
      {#each viewport.logical_byte_values() as byte}
        <LogicalValueDiv {byte} on:mouseup={mouseup} on:mousedown={mousedown} />
      {/each}
    {/key}
  {/if}
</div>

<style>
  div.byte-container {
    display: flex;
    flex-wrap: wrap;
    /* border-radius: 5px; */
    border-width: 0 2px 0 2px;
    border-style: solid;
    border-color: var(--color-primary-mid);
    background-color: var(--color-primary-dark);
    grid-row-start: 1;
    grid-row-end: 5;
  }
  div.phyiscal {
    grid-column: 2;
  }
  div.logical {
    grid-column: 3;
  }
  div.byte-container::-webkit-scrollbar {
    display: none;
  }
  div.byte-container.locked {
    overflow-y: hidden;
  }
</style>
