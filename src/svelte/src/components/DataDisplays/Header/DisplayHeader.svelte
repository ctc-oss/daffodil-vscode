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
  import {
    addressRadix,
    displayRadix,
    editMode,
    seekOffset,
    seekOffsetInput,
    selectionData,
    selectionSize,
  } from '../../../stores'
  import {
    EditByteModes,
    ADDRESS_RADIX_OPTIONS,
  } from '../../../stores/configuration'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
  import {
    viewport_references,
    type ViewportReferences,
  } from '../../../utilities/display'
  import { createEventDispatcher } from 'svelte'

  const eventDispatcher = createEventDispatcher()

  let physicalOffsetText: string
  let logicalOffsetText: string
  let selectionOffsetText: string
  let viewportRefs = viewport_references() as ViewportReferences

  $: selectionOffsetText = setSelectionOffsetInfo(
    'Selection',
    $selectionData.startOffset,
    $selectionData.endOffset,
    $selectionSize
  )

  $: {
    physicalOffsetText = getOffsetDisplay(
      $addressRadix,
      $displayRadix,
      'physical'
    )
    logicalOffsetText = getOffsetDisplay(
      $addressRadix,
      $displayRadix,
      'logical'
    )
    if (viewportRefs.logical) {
      viewportRefs.logical.style.maxWidth = $displayRadix === 2 ? '105pt' : ''
    }
  }

  function getOffsetDisplay(address: number, radix: number, view: string) {
    // address, followed by radix
    const offsetDisplays = {
      16: {
        // address are in hex
        16: {
          // radix is hex
          text: '0000000000000000<br/>0123456789ABCDEF',
          spread: 2,
        },
        10: {
          // radix is decimal
          text: '0000000000000000<br/>0123456789ABCDEF',
          spread: 3,
        },
        8: {
          // radix is octal
          // text: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 <br/>0 1 2 3 4 5 6 7 8 9 A B C D E F ',
          text: '0000000000000000<br/>0123456789ABCDEF',
          spread: 3,
        },
        2: {
          // radix is binary
          text: '0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 3&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 4&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 5&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 6&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 7&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <br/><em><b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567</em> ',
          spread: 1,
        },
      },
      10: {
        // address are in decimal
        16: {
          // radix is hex
          text: '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 <br/>0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 ',
          spread: 2,
        },
        10: {
          // radix is decimal
          text: '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 <br/>0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 ',
          spread: 3,
        },
        8: {
          // radix is octal
          text: '0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 <br/>0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 ',
          spread: 3,
        },
        2: {
          // radix is binary
          text: '0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 3&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 4&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 5&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 6&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 7&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <br/><em><b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567</em> ',
          spread: 1,
        },
      },
      8: {
        // address are in octal
        16: {
          // radix is hex
          text: '0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 <br/>0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 ',
          spread: 2,
        },
        10: {
          // radix is decimal
          text: '0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 <br/>0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 ',
          spread: 3,
        },
        8: {
          // radix is octal
          text: '0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 <br/>0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 ',
          spread: 3,
        },
        2: {
          // radix is binary
          text: '0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 3&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 4&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 5&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 6&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 7&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <br/><em><b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567 <b>0</b>1234567</em> ',
          spread: 1,
        },
      },
    }

    let spread = offsetDisplays[address][radix].spread
    if (view === 'logical') {
      if (radix === 2)
        return (
          '0 0 0 0 0 0 0 0 <br>0 1 2 3 4 5 6 7 '.replaceAll(' ', '&nbsp;') +
          '&nbsp'
        )
      spread = 1
    }
    return offsetDisplays[address][radix].text

    // return (
    //   offsetDisplays[address][radix].text.replaceAll(
    //     ' ',
    //     '&nbsp;'.repeat(spread)
    //   ) + '&nbsp'
    // )
  }

  export function setSelectionOffsetInfo(
    from: string,
    start: number,
    end: number,
    size: number
  ): string {
    return `${from} [${start} - ${end}] Size: ${size} `
  }

  function updateAddressValue(event: Event) {
    const addrSelect = event.target as HTMLSelectElement
    const newSeekInput = $seekOffset.toString(parseInt(addrSelect.value))
    $seekOffsetInput = newSeekInput === 'NaN' ? '0' : newSeekInput
    $addressRadix = parseInt(addrSelect.value)
  }

  function clearDataDisplays() {
    eventDispatcher('clearDataDisplays')
  }
</script>

<div class={$UIThemeCSSClass + ' hd'}>Address</div>
<div class={$UIThemeCSSClass + ' hd'}>Physical</div>
<div class={$UIThemeCSSClass + ' hd'}>Logical</div>
<div class={$UIThemeCSSClass + ' hd'}>Edit</div>
<div class={$UIThemeCSSClass + ' measure'} style="align-items: center;">
  <select
    class={$UIThemeCSSClass + ' address_type'}
    id="address_numbering"
    on:change={updateAddressValue}
  >
    {#each ADDRESS_RADIX_OPTIONS as { name, value }}
      <option {value}>{name}</option>
    {/each}
  </select>
</div>

<div class={$UIThemeCSSClass + ' measure viewports'}>
  <span id="physical_offsets">
    {@html physicalOffsetText}
  </span>
</div>

<div class={$UIThemeCSSClass + ' measure viewports'}>
  <span id="logical_offsets">
    {@html logicalOffsetText}
  </span>
</div>
<div class={$UIThemeCSSClass + ' measure selection'}>
  {#if $editMode === EditByteModes.Multiple}
    {#if $selectionData.active}
      <div
        class="clear-selection"
        title="Clear selection data"
        on:click={clearDataDisplays}
        on:keypress={clearDataDisplays}
      >
        &#10006;
      </div>
    {:else}
      <div class="clear-selection" />
    {/if}
    <div>
      {selectionOffsetText}
    </div>
  {:else}
    <div>
      <sub
        ><i
          >To edit multiple bytes, highlight (by clicking and dragging) a
          selection of bytes</i
        ></sub
      >
    </div>
  {/if}
</div>
