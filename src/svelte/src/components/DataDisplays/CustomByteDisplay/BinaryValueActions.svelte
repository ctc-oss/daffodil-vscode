<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import {
    byteActionPxOffsets,
    type ByteValue,
    type EditByteAction,
    selectedByte,
    type ByteActionPxOffsets,
  } from './BinaryData'
  import { enterKeypressEvents } from '../../../utilities/enterKeypressEvents'
  import {
    addressRadix,
    commitErrMsg,
    committable,
    displayRadix,
    editByte,
    editMode,
    editorSelection,
    selectionData,
  } from '../../../stores'
  import { radixBytePad, radixToString } from '../../../utilities/display'
  import { EditByteModes } from '../../../stores/configuration'

  const byteInputId = 'byte-input'
  const eventDispatcher = createEventDispatcher()
  let editedByteText: string
  let invalid: boolean
  let inProgress: boolean
  let active: boolean
  let styleOffsets: ByteActionPxOffsets

  onMount(() => {
    enterKeypressEvents.register({
      id: byteInputId,
      run: () => {
        if (invalid || inProgress) return
        commitChanges('byte-input')
      },
    })
    // document.getElementById('byte-input').focus() // Why does this always fail?
  })

  $: styleOffsets = $byteActionPxOffsets
  $: active = $selectionData.active
  $: if ($editMode === EditByteModes.Single) {
    $editorSelection = $editByte
  }
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

  function update_selectedByte(editByte: ByteValue) {
    if (invalid) return
    $selectedByte = editByte
  }

  function send_delete(_: Event) {
    commitChanges('delete')
  }

  function send_insert(event: Event) {
    const target = event.target as HTMLElement
    commitChanges(target.id as EditByteAction)
  }

  function commitChanges(action: EditByteAction) {
    if (action === 'byte-input') {
      update_selectedByte({
        text: editedByteText,
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
  <div
    class="delete"
    on:click={send_delete}
    style="top: {styleOffsets.delete.top}px; left: {styleOffsets.delete
      .left}px;"
  >
    &#10006;
  </div>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="insert-before"
    id="insert-before"
    style="top: {styleOffsets.insertBefore.top}px; left: {styleOffsets
      .insertBefore.left}px;"
    on:click={send_insert}
  >
    &#8676;
  </div>

  <input
    id="byte-input"
    type="text"
    class:invalid
    class:inProgress
    title="byte position {$selectionData.startOffset.toString(
      $addressRadix
    )} {radixToString($addressRadix)}"
    bind:value={$editorSelection}
    on:input={handleEditorEvent}
    style="top: {styleOffsets.input.top}px; left: {styleOffsets.input.left}px;"
  />

  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    id="insert-after"
    class="insert-after"
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
    font-family: monospace;
    border-radius: 5px;
    border-style: solid;
    border-width: 2px;
    border-color: var(--color-primary-dark);
    height: 20px;
    width: 20px;
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
