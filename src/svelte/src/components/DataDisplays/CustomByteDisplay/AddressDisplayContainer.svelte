<!--
Licensed to the Apache Software Foundation (ASF) under one or more
contributor license agreements.  See the NOTICE file distributed with
this work for additional information regarding copyright ownership.
The ASF licenses this file to You under the Apache License, Version 2.0
(the "License"); you may not use this file except in compliance with
the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
<script lang="ts">
  import { selectionDataStore } from '../../../stores'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import { onMount } from 'svelte'

  export let topLine = 0
  export let bytesPerRow = 16
  export let radix = 16

  const MAX_LINES = 20

  let addresses: Array<string> = []
  $: if (addresses) generate_address_lines(topLine)
  onMount(() => {
    addresses = new Array(MAX_LINES)
    generate_address_lines(topLine)
  })

  let height = `calc(${MAX_LINES} * 20)px`

  function generate_address_lines(from: number) {
    for (let i = 0; i < MAX_LINES; i++) {
      addresses[i] = from.toString(radix)
      from += bytesPerRow
    }
  }
</script>

<button
  id="increment"
  on:click={() => {
    topLine += bytesPerRow
  }}>+</button
>
<button
  id="decrement"
  on:click={() => {
    topLine -= bytesPerRow
  }}>-</button
>
<div class="container" style:height>
  {#key topLine}
    {#each addresses as address}
      <div>{address}</div>
    {/each}
  {/key}
</div>

<style lang="scss">
  div.container {
    width: 80pt;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
  }
  div.container div {
    width: 100%;
  }
</style>
