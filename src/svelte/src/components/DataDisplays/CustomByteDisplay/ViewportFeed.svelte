<script lang="ts">
  import { getUIMsgId, currentViewport } from "stores/states.svelte"
  import { vscode } from "utilities/vscode"
  import { ViewportDataFeedState } from "./DataFeed.svelte"


  const {addListener} = vscode.getMessenger(getUIMsgId())
  const viewportData = currentViewport()
  const viewportFeed = new ViewportDataFeedState(viewportData)

  addListener('viewportRefresh', (response) => {viewportData.update(response)})
</script>

{#each viewportFeed.dataFeed() as bytesLine, i}
    <div class={`line ${bytesLine.highlight}`}>
        <div class='address' id='address'>
            <b>{bytesLine.offset}</b>
        </div>
    </div>
    <div class='byte-line' id='physical-line-{i.toString(16).padStart(2,'0')}'>
        {#each bytesLine.bytes as byte}
            {byte.text ?? '.'}
        {/each}
    </div>
{/each}
