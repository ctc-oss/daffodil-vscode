<script lang="ts">
  export let totalLines = 0
  export let currentLine = 0
  export let fileOffset = 0
  export let bytesPerRow = 16

  let percentageTraversed = 0.0
  let offsetAdjustment = 0

  $: {
    offsetAdjustment = fileOffset / bytesPerRow + 20
    percentageTraversed =
      ((currentLine + offsetAdjustment) / totalLines) * 100.0
  }
</script>

<div class="traversal-container">
  <div class="traversal-thumb" style:width="{percentageTraversed}%" />
</div>

<style lang="scss">
  div.traversal-container {
    background-color: var(--color-secondary-dark);
  }
  div.traversal-thumb {
    background-color: var(--color-secondary-light);
    transition: all 0.5s;
  }
  div.traversal-container,
  div.traversal-thumb {
    height: 4px;
  }
</style>
