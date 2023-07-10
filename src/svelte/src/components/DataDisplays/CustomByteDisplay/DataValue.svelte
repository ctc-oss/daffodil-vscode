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
  import { createEventDispatcher } from 'svelte'
  import {
    EditByteModes,
    RADIX_OPTIONS,
    type RadixValues,
  } from '../../../stores/configuration'
  import {
    latin1Undefined,
    type ByteSelectionEvent,
    type ByteValue,
    type ViewportDataType,
  } from './BinaryData'
  import { SelectionData } from '../../../stores'
  import {
    byteDivWidthFromRadix,
    type ByteDivWidth,
  } from '../../../utilities/display'

  export let id: ViewportDataType
  export let byte: ByteValue
  export let editMode: EditByteModes
  export let selectionData: SelectionData
  export let selectedByte: ByteValue
  export let radix: RadixValues
  export let disabled = false

  const eventDispatcher = createEventDispatcher()

  let bgColor: string
  let borderColor: string
  let singleSelected,
    withinSelectionRange,
    makingSelection = false
  let width: ByteDivWidth = '20px'

  $: makingSelection =
    selectionData.startOffset >= 0 && selectionData.active === false
  $: width = byteDivWidthFromRadix(radix)
  $: singleSelected =
    selectionData.active && editMode === EditByteModes.Single
      ? selectedByte.offset === byte.offset
      : false
  $: {
    withinSelectionRange =
      selectionData.active && editMode === EditByteModes.Multiple
        ? byte_within_selection_range()
        : false
  }
  $: {
    if ((singleSelected || withinSelectionRange) && selectionData.active)
      bgColor = 'var(--color-secondary-mid)'
    else if (
      makingSelection &&
      (byte.offset === selectionData.startOffset ||
        byte.offset === selectionData.endOffset)
    )
      borderColor = 'var(--color-secondary-mid)'
    else {
      bgColor = 'var(--color-primary-dark)'
      borderColor = 'var(--color-primary-dark)'
    }
  }

  function mouse_enter_handle(event: MouseEvent) {
    if (!makingSelection) return
    selectionData.endOffset = byte.offset
    console.log(selectionData)
  }
  function mouse_leave_handle(event: MouseEvent) {
    if (!makingSelection) return
    if (byte.offset != selectionData.startOffset)
      borderColor = 'var(--color-primary-dark)'
  }
  function mouse_event_handle(event: MouseEvent) {
    const type = event.type
    const targetElement = event.target
    if (id === 'logical') byte.text = String.fromCharCode(byte.value)
    eventDispatcher(type, {
      targetElement: targetElement,
      targetByte: byte,
      fromViewport: id,
    } as ByteSelectionEvent)
  }

  function byte_within_selection_range(): boolean {
    return (
      byte.offset >= selectionData.startOffset &&
      byte.offset <= selectionData.originalEndOffset
    )
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if disabled}
  <div class="byte disabled" style:width={id === 'logical' ? '20px' : width} />
{:else if id === 'physical'}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="byte"
    style:width
    style:background-color={bgColor}
    style:border-color={makingSelection ? borderColor : bgColor}
    on:mouseup={mouse_event_handle}
    on:mousedown={mouse_event_handle}
    on:mouseenter={mouse_enter_handle}
    on:mouseleave={mouse_leave_handle}
  >
    {#if radix === RADIX_OPTIONS.Hexadecimal}
      {byte.text.toUpperCase()}
    {:else}
      {byte.text}
    {/if}
  </div>
{:else}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="byte"
    style:width={'20px'}
    class:latin1Undefined={latin1Undefined(byte.value)}
    style:background-color={bgColor}
    style:border-color={makingSelection ? borderColor : bgColor}
    on:mouseup={mouse_event_handle}
    on:mousedown={mouse_event_handle}
  >
    {String.fromCharCode(byte.value)}
  </div>
{/if}

<style>
  div.byte {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    font-family: var(--monospace-font);
    border-radius: 5px;
    border-style: solid;
    border-width: 2px;
    height: 20px;
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
  div.latin1Undefined::after {
    content: '?';
    font-size: 16px;
    filter: brightness(0.75);
  }
  div.disabled {
    background-color: var(--color-primary-darkest);
    color: var(--color-primary-darkest);
  }
</style>
