<script lang="ts">
  import {
    bytesPerRow,
    commitErrMsg,
    committable,
    focusedViewportId,
  } from '../../../stores'
  import { selectionData } from '../../Editors/DataEditor'
  import {
    BYTE_VALUE_DIV_OFFSET,
    _viewportData,
    selectedByte,
    type ByteValue,
  } from './BinaryData'
  import BinaryValueActions from './BinaryValueActions.svelte'
  import BinaryValue from './BinaryValueDiv.svelte'
  import LogicalDisplayDiv from './LogicalDisplayDiv.svelte'

  let logicalByteArray: ByteValue[] = []
  let selectionActive = false

  $: logicalByteArray = logical_bytes_from($_viewportData)

  $: selectionActive = $selectionData.active

  function latin1_undefined(charCode: number): boolean {
    return charCode < 32 || (charCode > 126 && charCode < 160)
  }

  function logical_bytes_from(bytes: Uint8Array): ByteValue[] {
    // const undefinedCharStandIn = String.fromCharCode(9617)
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
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="byte-container"
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
    overflow-y: scroll;
  }
  div.byte-container::-webkit-scrollbar {
    width: 0;
  }
  div.byte-container.locked {
    overflow-y: hidden;
  }
</style>
