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
    gotoOffset,
    gotoOffsetInput,
    addressValue,
    displayRadix,
    cursorPos,
    selectionSize,
  } from '../../../stores'
  import { EditByteModes, addressOpt } from '../../../stores/Configuration'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
  import {
    getOffsetDisplay,
    setSelectionOffsetInfo,
    viewport_references,
    type ViewportReferences,
  } from '../../../utilities/display'
  import { createEventDispatcher } from 'svelte'
  import { selectionData, editMode } from '../../Editors/DataEditor'

  const EventDispatcher = createEventDispatcher()

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
      $addressValue,
      $displayRadix,
      'physical'
    )
    logicalOffsetText = getOffsetDisplay(
      $addressValue,
      $displayRadix,
      'logical'
    )
    if (viewportRefs.logical) {
      viewportRefs.logical.style.maxWidth = $displayRadix === 2 ? '105pt' : ''
    }
  }
  function updateAddressValue(event: Event) {
    const addrSelect = event.target as HTMLSelectElement
    const newGotoInput = $gotoOffset.toString(parseInt(addrSelect.value))
    $gotoOffsetInput = newGotoInput === 'NaN' ? '0' : newGotoInput
    $gotoOffset = parseInt($gotoOffsetInput, $addressValue)
    $addressValue = parseInt(addrSelect.value)
  }

  function clearDataDisplays() {
    EventDispatcher('clearDataDisplays')
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
    {#each addressOpt as { name, value }}
      <option {value}>{name}</option>
    {/each}
  </select>
</div>

<div class={$UIThemeCSSClass + ' measure'}>
  <span id="physical_offsets">
    {@html physicalOffsetText}
  </span>
</div>

<div class={$UIThemeCSSClass + ' measure'}>
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
      {selectionOffsetText}{#if $cursorPos} | cursor: {$cursorPos} {/if}
    </div>
  {:else}
    <div>
      <sub
        ><i
          >The pop-up, single byte, edit window is available upon byte
          selection, press ESC to close.<br />The edit window below is
          deactivated in single byte edit mode.</i
        ></sub
      >
    </div>
  {/if}
</div>

<style lang="scss">
</style>
