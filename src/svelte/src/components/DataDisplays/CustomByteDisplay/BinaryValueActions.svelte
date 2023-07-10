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
  import { createEventDispatcher, onMount } from 'svelte'
  import {
    byteActionPxOffsets,
    type ByteValue,
    type EditAction,
    selectedByte,
    type ByteActionPxOffsets,
  } from './BinaryData'
  import { enterKeypressEvents } from '../../../utilities/enterKeypressEvents'
  import {
    commitErrMsg,
    committable,
    displayRadix,
    editByte,
    editMode,
    editorSelection,
    selectionData,
  } from '../../../stores'
  import {
    radixBytePad,
    type ByteDivWidth,
    byteDivWidthFromRadix,
  } from '../../../utilities/display'
  import { EditByteModes } from '../../../stores/configuration'

  export let byte: ByteValue

  const byteInputId = 'byte-input'
  const eventDispatcher = createEventDispatcher()
  let editedByteText: string
  let invalid: boolean
  let inProgress: boolean
  let active: boolean
  let styleOffsets: ByteActionPxOffsets
  let inputWidth: ByteDivWidth

  enterKeypressEvents.register({
    id: byteInputId,
    run: () => {
      if (invalid || inProgress) return
      commitChanges('byte-input')
    },
  })

  $: styleOffsets = $byteActionPxOffsets
  $: active = $selectionData.active
  $: $editorSelection = byte.text
  $: {
    if (
      !$committable &&
      $commitErrMsg.length > 0 &&
      $editorSelection.length >= radixBytePad($displayRadix)
    ) {
      invalid = true
      inProgress = false
    } else if (
      !$committable &&
      $commitErrMsg.length > 0 &&
      $editorSelection.length < radixBytePad($displayRadix)
    ) {
      invalid = false
      inProgress = true
    } else {
      invalid = false
      inProgress = false
    }
  }
  $: {
    inputWidth = byteDivWidthFromRadix($displayRadix)
  }
  function update_selectedByte(editByte: ByteValue) {
    if (invalid) return
    $selectedByte = editByte
  }

  function send_delete(_: Event) {
    commitChanges('delete')
  }

  function send_insert(event: Event) {
    const target = event.target as HTMLElement
    commitChanges(target.id as EditAction)
  }

  function commitChanges(action: EditAction) {
    if (action === 'byte-input') {
      update_selectedByte({
        text: $editorSelection,
        offset: $selectedByte.offset,
        value: parseInt(editedByteText, 16),
      })
    }

    eventDispatcher('commitChanges', {
      byte: $selectedByte,
      action: action,
    })
  }

  function handleEditorEvent() {
    eventDispatcher('handleEditorEvent')
  }
</script>

{#if active && $editMode === EditByteModes.Single}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="delete"
    on:click={send_delete}
    style:width={inputWidth}
    style="top: {styleOffsets.delete.top}px; left: {styleOffsets.delete
      .left}px;"
  >
    &#10006;
  </div>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="insert-before"
    id="insert-before"
    style:width={inputWidth}
    style="top: {styleOffsets.insertBefore.top}px; left: {styleOffsets
      .insertBefore.left}px;"
    on:click={send_insert}
  >
    &#8676;
  </div>

  <input
    id={byteInputId}
    type="text"
    class:invalid
    class:inProgress
    placeholder={$editByte}
    bind:value={$editorSelection}
    on:input={handleEditorEvent}
    style:width={inputWidth}
    style="top: {styleOffsets.input.top}px; left: {styleOffsets.input.left}px;"
  />

  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    id="insert-after"
    class="insert-after"
    style:width={inputWidth}
    style="top: {styleOffsets.insertAfter.top}px; left: {styleOffsets
      .insertAfter.left}px;"
    on:click={send_insert}
  >
    &#8677;
  </div>
{/if}

<style lang="scss">
  @keyframes shake {
    0%,
    100% {
      translate: 0;
    }
    25% {
      translate: -3px;
    }
    75% {
      translate: 3px;
    }
  }
  div.insert-before,
  div.insert-after,
  div.delete,
  input {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    flex-direction: row;
    font-family: var(--monospace-font);
    border-radius: 5px;
    border-style: solid;
    border-width: 2px;
    border-color: var(--color-primary-dark);
    height: 20px;
    transition: border-color 0.25s, top 0.15s, left 0.15s, right 0.15s;
    outline: none;
  }
  div.insert-before,
  div.insert-after,
  div.delete {
    font-size: 20px;
    line-height: 1;
    position: absolute;
    z-index: 1;
  }
  div.insert-before,
  div.insert-after {
    font-size: 20px;
    position: absolute;
    border-style: dashed;
    border-color: var(--color-secondary-mid);
    color: transparent;
  }
  div.insert-before:hover,
  div.insert-after:hover {
    background-color: var(--color-primary-dark);
    color: var(--color-secondary-lightest);
    border-color: var(--color-secondary-light);
    cursor: pointer;
  }
  div.delete {
    background-color: crimson;
    border-style: solid;
    color: var(--color-secondary-lightest);
  }
  div.delete:hover {
    border-color: var(--color-secondary-light);
    cursor: pointer;
  }

  input {
    background-color: var(--color-primary-mid);
    color: var(--color-secondary-lightest);
    padding: 0;
  }
  input {
    animation: none;
  }
  input.invalid {
    border-color: crimson;
    animation: shake 0.15s 3;
  }
  input.inProgress {
    border-color: gold;
  }
</style>
