<script lang="ts">
  import type { Writable, Readable } from 'svelte/store'
  import type { SimpleWritable } from '../../stores/localStore'

  export let name: string
  export let store: Writable<any> | Readable<any>
  export const array: boolean = false
  const storeKeys = Object.keys($store)
  const hasKeys = storeKeys.length > 0
</script>

<div class="container">
  <div>{name}</div>
  <div>
    {#if $store}
      {#if hasKeys}
        {#each Object.keys($store) as key}
          <u>{key}</u>: {$store[key]}<br />
        {/each}
      {:else}
        {$store}
      {/if}
    {:else}
      <b>-</b>
    {/if}
  </div>
</div>

<style lang="scss">
  div.container {
    display: flex;
    width: 100%;
    flex-direction: row;
    font-family: var(--monospace-font);
  }

  div.container div {
    width: 50%;
    max-height: 70pt;
    border: 2px solid grey;
    overflow: scroll;
    overflow-wrap: normal;
  }
</style>
