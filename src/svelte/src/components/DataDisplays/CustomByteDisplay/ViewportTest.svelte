<script lang="ts">
  import { ViewportDataFeed } from './DataFeed.svelte'
  import { ViewportState } from './ViewportState.svelte'
  import { type ViewportRefreshResponse } from 'ext_types'
  import ViewportFeed from './ViewportFeed.svelte'

  const viewportData: ViewportState = $state<ViewportState>(
    new ViewportState('testvp')
  )
  const viewportFeed: ViewportDataFeed = new ViewportDataFeed(viewportData)
  const isFeedValid = $derived.by<boolean>(() => {
    if (!viewportData.valid) return false
    return true
  })

  function getRandomData() {
    // viewportData.reset()
    // return
    let data = new Uint8Array(1024).fill(0x00)
    data = data.map((v, i) => {
      let ret = v + data.byteLength - i
      ret ^= 0x69

      return ret
    })
    const respStub: ViewportRefreshResponse = {
      fileOffset: 0,
      bytesLeft: 0,
      capacity: 1024,
      data,
      length: 1024,
      viewportId: viewportData.viewportId,
    }
    viewportData.update(respStub)
  }
</script>

<button onclick={() => getRandomData()}>Random Data</button>
<h4>Is Viewport Valid: {isFeedValid}</h4>

{#if isFeedValid}
  <ViewportFeed {viewportFeed} />
{/if}
