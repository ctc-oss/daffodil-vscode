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
    committable,
    commitErrMsg,
    editByte,
    editorSelection,
  } from '../../../stores'
  import { editMode, selectionData } from '../../Editors/DataEditor'
  import { radixToString } from '../../../utilities/display'
  import { EditByteModes } from '../../../stores/configuration'

  const byteInputId = 'byte-input'
  const eventDispatcher = createEventDispatcher()
  let editedByteText: string
  let invalid: boolean
  let active: boolean
  let styleOffsets: ByteActionPxOffsets
  onMount(() => {
    enterKeypressEvents.register({
      id: byteInputId,
      run: () => {
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
  $: invalid = !$committable && $commitErrMsg.length > 0

  function update_selectedByte(editByte: ByteValue) {
    if (invalid) {
      console.log('Editing byte value invalid')
      return
    }
    $selectedByte = editByte
  }

  function send_delete(_: Event) {
    commitChanges('delete')
    console.log('send-delete')
  }

  function send_insert(event: Event) {
    const target = event.target as HTMLElement
    commitChanges(target.id as EditByteAction)
  }

  function commitChanges(action: EditByteAction) {
    const replacing = action === 'byte-input'
    if (replacing) {
      update_selectedByte({
        text: editedByteText,
        offset: $selectedByte.offset,
        value: parseInt(editedByteText, 16),
      })
    }

    eventDispatcher('commitChanges', {
      byte: replacing ? selectedByte : $selectedByte,
      action: action,
    })
  }
  function handleEditorEvent() {
    eventDispatcher('handleEditorEvent')
  }
</script>

{#if active}
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
  div.insert-before,
  div.insert-after,
  div.delete,
  input {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    font-family: monospace;
    border-radius: 5px;
    border-style: solid;
    border-width: 2px;
    height: 20px;
    width: 20px;
    text-align: center;
    border-color: var(--color-primary-dark);
    transition: all 0.25s;
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
    cursor: pointer;
  }
  div.delete {
    background-color: crimson;
    border-style: solid;
    color: white;
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
  input.invalid {
    border-color: crimson;
  }
</style>
