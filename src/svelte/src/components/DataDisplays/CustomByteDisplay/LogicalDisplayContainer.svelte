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
    bytesPerRow,
    editedDataSegment,
    editMode,
    editorEncoding,
    focusedViewportId,
    selectionData,
    selectionSize,
  } from '../../../stores'
  import { EditByteModes } from '../../../stores/configuration'
  import { MessageCommand } from '../../../utilities/message'
  import { vscode } from '../../../utilities/vscode'
  import {
    BYTE_VALUE_DIV_OFFSET,
    _viewportData,
    selectedByte,
    type ByteValue,
    update_byte_action_offsets,
  } from './BinaryData'
  import LogicalDisplayDiv from './LogicalValueDiv.svelte'

  export const id: string = ''
  export let boundContainerId: HTMLDivElement

  let logicalByteArray: ByteValue[]
  let selectionActive

  $: logicalByteArray = logical_bytes_from($_viewportData)
  $: selectionActive = $selectionData.active

  function latin1_undefined(charCode: number): boolean {
    return charCode < 32 || (charCode > 126 && charCode < 160)
  }

  function logical_bytes_from(bytes: Uint8Array): ByteValue[] {
    let ret = new Array<ByteValue>(bytes.length)

    for (let i = 0; i < bytes.length; i++) {
      ret[i] = latin1_undefined(bytes[i])
        ? ({ text: '', offset: i, value: bytes[i] } as ByteValue)
        : ({
            text: String.fromCharCode(bytes[i]),
            offset: i,
            value: bytes[i],
          } as ByteValue)
    }
    return ret
  }
  function select_byte(event: CustomEvent) {
    $focusedViewportId = 'logical'

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
<div {id}
  bind:this={boundContainerId}
  class="byte-container {id}"
  class:locked={$selectionData.active}
  style="width: calc({$bytesPerRow} * {BYTE_VALUE_DIV_OFFSET}px);"
>
  {#key logicalByteArray}
    {#each logicalByteArray as byte}
      <LogicalDisplayDiv {byte} on:select_byte={select_byte} />
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
    height: 150px;
  }
  div.byte-container::-webkit-scrollbar {
    width: 0;
  }
  div.byte-container.locked {
    overflow-y: hidden;
  }
</style>
