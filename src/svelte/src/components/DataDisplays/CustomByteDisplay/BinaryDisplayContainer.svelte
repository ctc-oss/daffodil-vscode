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
    editedDataSegment,
    editorEncoding,
    focusedViewportId,
    selectionSize,
    editMode,
    selectionData,
    viewportScrollTop,
  } from '../../../stores'
  import { EditByteModes } from '../../../stores/configuration'
  import { MessageCommand } from '../../../utilities/message'
  import { vscode } from '../../../utilities/vscode'
  import {
    BYTE_VALUE_DIV_OFFSET,
    update_byte_action_offsets,
    _viewportData,
    selectedByte,
    type ByteSelectionEvent,
    type ByteValue,
    null_byte,
  } from './BinaryData'
  import { bytesPerRow } from './BinaryData'
  import BinaryValue from './BinaryValueDiv.svelte'

  export const id: string = ''
  export let boundContainerId: HTMLDivElement

  function mousedown(event: CustomEvent<ByteSelectionEvent>) {
    $selectionData.active = false
    $selectionData.startOffset = event.detail.targetByte.offset
  }
  function mouseup(event: CustomEvent<ByteSelectionEvent>) {
    $selectionData.endOffset = event.detail.targetByte.offset
    $selectionData.originalEndOffset = event.detail.targetByte.offset
    $selectionData.active = true
    adjust_event_offsets()

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

    $selectedByte = $editMode === EditByteModes.Single
      ? selectionEvent.targetByte
      : null_byte()

    update_byte_action_offsets(selectionEvent.targetElement, $viewportScrollTop)

    editedDataSegment.update(() => {
      return Uint8Array.from(
        $_viewportData.subarray(
          $selectionData.startOffset,
          $selectionData.endOffset + 1
        )
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
        fileOffset: $selectionData.startOffset,
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
  {id}
  bind:this={boundContainerId}
  class="byte-container hide-scrollbar {id}"
  class:locked={$selectionData.active}
  style="width: calc({$bytesPerRow} * {BYTE_VALUE_DIV_OFFSET}px);"
>
  {#key $_viewportData}
    {#each _viewportData.physical_byte_values(16, 16) as byte}
      <BinaryValue {byte} on:mouseup={mouseup} on:mousedown={mousedown} />
    {/each}
  {/key}
</div>

<style>
  div.byte-container {
    display: flex;
    flex-wrap: wrap;
    border-radius: 5px;
    border-width: 2px;
    border-style: solid;
    border-color: var(--color-primary-mid);
    background-color: var(--color-primary-dark);
    overflow: scroll;
    grid-row-start: 3;
    grid-row-end: 5;
    grid-column: 2;
  }
  div.byte-container::-webkit-scrollbar {
    display: none;
  }
  div.byte-container.locked {
    overflow-y: hidden;
  }
</style>
