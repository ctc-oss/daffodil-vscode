<script lang="ts">
  import { randomBytes } from 'crypto'
  import { ViewportDataFeed } from './DataFeed.svelte'
  import { ViewportState } from './ViewportState.svelte'
  import { type ViewportRefreshResponse } from 'ext_types'
  import ViewportFeed from './ViewportFeed.svelte'

  const viewportData: ViewportState = new ViewportState('testvp')
  const viewportFeed: ViewportDataFeed = new ViewportDataFeed(viewportData)
  const isFeedValid = $derived.by<boolean>(() => {
    if (viewportData.isInitialized()) return false
    return true
  })

  function getRandomData() {
    const data = randomBytes(1024)
    const respStub: ViewportRefreshResponse = {
      fileOffset: viewportData.fileOffset(),
      bytesLeft: viewportData.bytesLeft(),
      capacity: viewportData.capacity(),
      data,
      length: viewportData.length(),
      viewportId: viewportData.viewportId(),
    }
    viewportData.update(respStub)
  }
</script>

<button on:click={getRandomData}>Random Data</button>
<h4>Is Viewport Valid: {isFeedValid}</h4>

{#if isFeedValid}
  <ViewportFeed {viewportFeed} />
{/if}
