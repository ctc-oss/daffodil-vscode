<script lang="ts">
  import { ViewportDataFeed } from './DataFeed.svelte'
  type ViewportComponentProps = {
    viewportFeed: ViewportDataFeed
  }
  const { viewportFeed }: ViewportComponentProps = $props()
</script>

{#each viewportFeed.dataFeed as bytesLine, i}
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
