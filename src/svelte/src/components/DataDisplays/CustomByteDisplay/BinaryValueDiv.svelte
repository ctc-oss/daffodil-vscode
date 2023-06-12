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
  import { displayRadix, selectionData } from '../../../stores'
  import { RADIX_OPTIONS } from '../../../stores/configuration'
  import {
    mouseSelectionBytes,
    type ByteSelectionEvent,
    type ByteValue,
  } from './BinaryData'
  import { selectedByte } from './BinaryData'
  import { createEventDispatcher } from 'svelte'

  const eventDispatcher = createEventDispatcher()
  
 /* TODO:  All this needs to be moved to a parent component. Given that there are
         1000 ByteValueDiv components, I feel like there are also 1000 of each
         of the variables that are declared in this .svelte file. */

  export let byte: ByteValue
  let bgColor: string
  let selected: boolean
  let withinSelectionRange: boolean

  $: selected = $selectionData.active
    ? $selectedByte.offset === byte.offset
    : false
  $: withinSelectionRange =
    byte.offset >= $mouseSelectionBytes.mousedown &&
    byte.offset <= $mouseSelectionBytes.mouseup

  $: {
    if (selected || withinSelectionRange) bgColor = 'var(--color-secondary-mid)'
    else bgColor = 'var(--color-primary-dark)'
  }

  function select_byte(targetElement: HTMLDivElement) {
    eventDispatcher('select_byte', {
      targetElement: targetElement,
      targetByte: byte,
      type: 'Single',
    } as ByteSelectionEvent)
  }
  function select_byte_range(event: Event) {
    $mouseSelectionBytes.mouseup = byte.offset
    const target = event.target as HTMLDivElement

    if ($mouseSelectionBytes.mousedown === $mouseSelectionBytes.mouseup) {
      select_byte(target)
      return
    }
    if (
      $mouseSelectionBytes.mousedown >= 0 &&
      $mouseSelectionBytes.mouseup >= 0
    ) {
      const startOffset =
        $mouseSelectionBytes.mousedown < $mouseSelectionBytes.mouseup
          ? $mouseSelectionBytes.mousedown
          : $mouseSelectionBytes.mouseup
      const endOffset =
        $mouseSelectionBytes.mousedown > $mouseSelectionBytes.mouseup
          ? $mouseSelectionBytes.mousedown
          : $mouseSelectionBytes.mouseup

      $selectedByte = { text: '', offset: -1, value: -1 }
      selectionData.update((data) => {
        data.active = true
        data.startOffset = startOffset
        data.endOffset = endOffset
        data.originalEndOffset = endOffset
        return data
      })
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->

<div
  class="byte"
  style:background-color={bgColor}
  style:border-color={bgColor}
  on:mouseup={select_byte_range}
  on:mousedown={() => {
    $mouseSelectionBytes.mousedown = byte.offset
  }}
  on:mouseenter={(event) => {
    const selecting =
      $mouseSelectionBytes.mousedown >= 0 && $mouseSelectionBytes.mouseup === -1
    if (selecting) select_byte_range(event)
  }}
>
  {#if $displayRadix === RADIX_OPTIONS.Hexadecimal}
    {byte.text.toUpperCase()}
  {:else}
    {byte.text}
  {/if}
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
  div.byte::selection {
    background-color: transparent;
  }
</style>
