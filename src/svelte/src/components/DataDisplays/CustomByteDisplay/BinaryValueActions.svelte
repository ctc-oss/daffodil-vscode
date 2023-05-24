<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import {
    byteActionPxOffsets,
    type ByteValue,
    type EditByteAction,
    type EditByteEvent,
  } from './BinaryData'
  import { enterKeypressEvents } from '../../../utilities/enterKeypressEvents'
  import { addressRadix, editByte, editorSelection } from '../../../stores'
  import { editMode, selectionData } from '../../Editors/DataEditor'
  import { radixToString } from '../../../utilities/display'
  import { EditByteModes } from '../../../stores/configuration'

  export let selectedByte: ByteValue
  export let invalid: boolean
  const byteInputId = 'byte-input'
  const eventDispatcher = createEventDispatcher()
  let editedByteText: string

  onMount(() => {
    enterKeypressEvents.register({
      id: byteInputId,
      run: () => {
        commitChanges()
      },
    })
    // document.getElementById('byte-input').focus() // Why does this always fail?
  })
  onDestroy(() => {
    enterKeypressEvents.remove(byteInputId)
  })

  $: if ($editMode === EditByteModes.Single) {
    $editorSelection = $editByte
  }

  function update_selectedByte(editByte: ByteValue) {
    if (invalid) {
      console.log('Editing byte value invalid')
      return
    }
    selectedByte = editByte
  }

  function send_delete(_: Event) {
    commitChanges('delete')
  }
  function send_insert(event: Event) {
    const target = event.target as HTMLElement
    commitChanges(target.id as EditByteAction)
  }

  function commitChanges(action?: EditByteAction) {
    update_selectedByte({
      text: editedByteText,
      offset: selectedByte.offset,
      value: parseInt(editedByteText, 16),
    })

    eventDispatcher('commitChanges', {
      byte: selectedByte,
      action: action,
    })
  }
  function handleEditorEvent() {
    eventDispatcher('handleEditorEvent')
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="delete"
  on:click={send_delete}
  style="top: {byteActionPxOffsets.delete.top}px; left: {byteActionPxOffsets
    .delete.left}px;"
>
  &#10006;
</div>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="insert-before"
  id="insert-before"
  style="top: {byteActionPxOffsets.insertBefore
    .top}px; left: {byteActionPxOffsets.insertBefore.left}px;"
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
  style="top: {byteActionPxOffsets.input.top}px; left: {byteActionPxOffsets
    .input.left}px;"
/>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  id="insert-after"
  class="insert-after"
  style="top: {byteActionPxOffsets.insertAfter
    .top}px; left: {byteActionPxOffsets.insertAfter.left}px;"
  on:click={send_insert}
>
  &#8677;
</div>

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
