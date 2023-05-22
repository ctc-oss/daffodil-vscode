<script lang="ts">
  import { type ByteValue, ByteValueWidths, editingByte } from './BinaryData'
  import { bytesPerRow } from './BinaryData'
  import BinaryValue from './BinaryValueDiv.svelte'
  
  export let binaryDataStr: string = '23212f62696e2f626173680a0a62696e733d606c73202f7573722f62696e600a6a61766162696e733d606c73202f4c6962726172792f4a6176612f4a6176615669727475616c4d616368696e65732f74656d7572696e2d382e6a646b2f436f6e74656e74732f486f6d652f62696e600a0a6563686f202d6520223d3d202f757372'
  let byteValues: string[] = []
  let binaryData: ByteValue[] = []
  let width
  $: {
    byteValues = binaryDataStr.match(/[0-9a-fA-F]{1,2}/g) || []
    binaryData = byteValues.map((byteStr, index) => {
      return { text: byteStr, offset: index / 2, value: parseInt(byteStr, 16) }
    })
    width = $editingByte ? ByteValueWidths.DISPLAY + 4 : (ByteValueWidths.DISPLAY + 4)*2
  }

</script>

<div style="width: calc({$bytesPerRow} * {width}px);">
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
    border-color: var(--color-primary-mid);
    background-color: var(--color-primary-dark);
    overflow: auto;
  }
</style>
