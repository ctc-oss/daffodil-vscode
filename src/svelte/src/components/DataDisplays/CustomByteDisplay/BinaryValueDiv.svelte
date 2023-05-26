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
  import { selectionData } from '../../Editors/DataEditor'
  import type { ByteValue } from './BinaryData'
  import { selectedByte } from './BinaryData'
  import { createEventDispatcher } from 'svelte'

  const eventDispatcher = createEventDispatcher()

  export let byte: ByteValue
  let bgColor: string
  let selected: boolean

  $: selected = $selectionData.active
    ? $selectedByte.offset === byte.offset
    : false
  $: bgColor = selected
    ? 'var(--color-secondary-mid)'
    : 'var(--color-primary-dark)'

  function select_byte(event: Event) {
    eventDispatcher('select_byte', {
      targetDiv: event.target as HTMLDivElement,
      targetByte: byte,
    })
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="byte"
  style:background-color={bgColor}
  style:border-color={bgColor}
  on:click={select_byte}
>
  {byte.text}
</div>

<style>
  div.byte {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    font-family: monospace;
    border-radius: 5px;
    border-style: solid;
    border-width: 2px;
    height: 20px;
    width: 20px;
    text-align: center;
    border-color: var(--color-primary-dark);
    transition: all 0.25s;
  }
  div.byte:hover {
    border-color: var(--color-primary-mid);
    cursor: pointer;
  }
</style>
