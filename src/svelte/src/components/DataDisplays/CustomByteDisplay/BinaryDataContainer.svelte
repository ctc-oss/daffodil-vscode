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
    commitErrMsg,
    committable,
    editedDataSegment,
    editorEncoding,
    focusedViewportId,
    selectionSize,
    viewportData,
  } from '../../../stores'
  import { EditByteModes } from '../../../stores/configuration'
  import { MessageCommand } from '../../../utilities/message'
  import { vscode } from '../../../utilities/vscode'
  import { editMode, selectionData } from '../../Editors/DataEditor'
  import {
    BYTE_VALUE_DIV_OFFSET,
    type ByteValue,
    update_byte_action_offsets,
    _viewportData,
    selectedByte,
  } from './BinaryData'
  import { bytesPerRow } from './BinaryData'
  import BinaryValueActions from './BinaryValueActions.svelte'
  import BinaryValue from './BinaryValueDiv.svelte'

  let selectionActive = false

  $: selectionActive = $selectionData.active

  function select_byte(event: CustomEvent) {
    $focusedViewportId = 'physical'

    $selectedByte = event.detail.targetByte
    selectionData.update((data) => {
      data.active = true
      data.startOffset = $selectedByte.offset
      data.endOffset = data.startOffset
      data.originalEndOffset = data.endOffset
      return data
    })

    update_byte_action_offsets(event.detail.targetDiv)

    editedDataSegment.update(() => {
      return Uint8Array.from(
        $_viewportData.subarray(
          $selectionData.startOffset,
          $selectionData.endOffset + 1
        )
      )
    })
    if ($editMode === EditByteModes.Single) postEditorOnChangeMsg('hex')
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
  class="byte-container"
  class:locked={$selectionData.active}
  style="width: calc({$bytesPerRow} * {BYTE_VALUE_DIV_OFFSET}px);"
>
  {#key selectionActive}
    {#if selectionActive}
      {#key $selectedByte.offset}
        <!-- Key off of offset changes, instead of entire object changes -->
        <BinaryValueActions
          invalid={!$committable && $commitErrMsg.length > 0}
          on:commitChanges
          on:handleEditorEvent
        />
      {/key}
    {/if}
  {/key}
  {#key $_viewportData}
    {#each _viewportData.physical_byte_values(16, 16) as byte}
      <BinaryValue {byte} on:select_byte={select_byte} />
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
    overflow-y: scroll;
  }
  div.byte-container::-webkit-scrollbar {
    width: 0;
  }
  div.byte-container.locked {
    overflow-y: hidden;
  }
</style>
