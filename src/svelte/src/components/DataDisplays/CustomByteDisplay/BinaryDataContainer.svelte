<script lang="ts">
  import { onMount } from 'svelte'
  import BinaryValue from './BinaryValueDiv.svelte'
  import type { ByteValue } from './BinaryData'
  import { bytesPerRow } from './BinaryData'

  export let binaryDataStr: string

  let byteValues: string[] = []
  let binaryData: ByteValue[] = []

  onMount(() => {
    byteValues = binaryDataStr.match(/[0-9a-fA-F]{1,2}/g) || [] // split the binary data into byte values
    binaryData = byteValues.map((byteStr, index) => {
      return { text: byteStr, offset: index / 2, value: parseInt(byteStr, 16) }
    })
  })
</script>

<div style="width: calc({$bytesPerRow} * 34px);">
  {#each binaryData as byte}
    <BinaryValue {byte} />
  {/each}
</div>

<style>
  div {
    display: flex;
    flex-wrap: wrap;
    border-radius: 5px;
    border-width: 2px;
    border-style: solid;
    border-color: lightgrey;
    overflow: auto;
  }
</style>
