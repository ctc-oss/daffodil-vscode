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
  import { onMount, tick, createEventDispatcher } from 'svelte'
  import {
    addressRadix,
    bytesPerRow,
    displayRadix,
    viewportData,
    viewportStartOffset,
  } from '../../stores'

  // TODO: Instead of using the store directly, we should use properties that
  //  are bound in from the parent component. This will provide better
  //  encapsulation.

  let gutterContainer: HTMLDivElement
  let physicalContainer: HTMLDivElement
  let logicalContainer: HTMLDivElement

  // TODO: Should come in from configuration
  const nonPrintableStandIn = 183 // bullet (•) for non-printable characters

  const eventDispatcher = createEventDispatcher()

  // Address generation for the gutter
  $: addresses = Array.from(
    {
      length: Math.ceil(
        ($viewportStartOffset + $viewportData.length) / $bytesPerRow
      ),
    },
    (_, i) => (i * $bytesPerRow).toString($addressRadix).toUpperCase()
  )

  function syncScroll(element: HTMLDivElement) {
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight
    const clientHeight = element.clientHeight

    switch (element.id) {
      case 'gutter':
        physicalContainer.scrollTop = scrollTop
        logicalContainer.scrollTop = scrollTop
        break
      case 'physical':
        gutterContainer.scrollTop = scrollTop
        logicalContainer.scrollTop = scrollTop
        break
      case 'logical':
        gutterContainer.scrollTop = scrollTop
        physicalContainer.scrollTop = scrollTop
        break
    }

    const scrolledTop = scrollTop === 0
    const scrolledEnd = scrollTop + clientHeight === scrollHeight
    if ((scrolledTop && !scrolledEnd) || (scrolledEnd && !scrolledTop)) {
      // fire scrollBoundary event when scrolled to the top or bottom
      eventDispatcher('scrollBoundary', { scrolledTop, scrolledEnd })
    }
  }

  function renderByte(byteArray: number[]): string {
    return byteArray
      .map((byte) =>
        byte.toString($displayRadix).toUpperCase().padStart(2, '0')
      )
      .join(' ')
  }

  function renderLatin1(byteArray: number[]): string {
    return byteArray
      .map((byte) => {
        const charCode = byte >= 32 && byte <= 126 ? byte : nonPrintableStandIn
        return String.fromCharCode(charCode)
      })
      .join(' ')
  }

  onMount(() => {
    gutterContainer.addEventListener('scroll', () =>
      syncScroll(gutterContainer)
    )
    physicalContainer.addEventListener('scroll', () =>
      syncScroll(physicalContainer)
    )
    logicalContainer.addEventListener('scroll', () =>
      syncScroll(logicalContainer)
    )
  })
</script>

<div class="container">
  <div class="content-container">
    <div class="header">Address</div>
    <div class="gutter hide-scrollbar" id="gutter" bind:this={gutterContainer}>
      {#each addresses as address, i}
        <div class={i % 2 === 0 ? 'even' : 'odd'}>{address}</div>
      {/each}
    </div>
  </div>

  <div class="content-container">
    <div class="header">Physical</div>
    <div
      class="content hide-scrollbar"
      id="physical"
      bind:this={physicalContainer}
    >
      {#each Array.from( { length: Math.ceil($viewportData.length / $bytesPerRow) } ) as _, i}
        <div>
          {#each $viewportData.slice(i * $bytesPerRow, (i + 1) * $bytesPerRow) as byte}
            {renderByte([byte]) + ' '}
          {/each}
        </div>
      {/each}
    </div>
  </div>

  <div class="content-container">
    <div class="header">Logical</div>
    <div
      class="content hide-scrollbar"
      id="logical"
      bind:this={logicalContainer}
    >
      {#each Array.from( { length: Math.ceil($viewportData.length / $bytesPerRow) } ) as _, i}
        <div>
          {#each $viewportData.slice(i * $bytesPerRow, (i + 1) * $bytesPerRow) as byte}
            {renderLatin1([byte]) + ' '}
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  div.container {
    display: flex;
  }

  div.header {
    font-size: 14px;
    font-weight: bold;
    padding: 2px;
    background-color: #8094d7;
    text-align: center; /* Center the header text */
  }

  div.gutter {
    width: 96px;
    height: 150px;
    border: 1px solid #2849b9;
    overflow-y: scroll;
    overflow-x: hidden; /* Prevent horizontal scrolling */
    direction: rtl; /* Move line numbers to the right side */
    line-height: 14px; /* Match line height with content */
  }

  div.even {
    display: flex;
    align-items: center;
    color: #424242;
    background-color: #f3f3f3;
    opacity: 0.8;
    justify-content: flex-start; /* Align numbers to the right */
    padding-right: 4px; /* Add right padding for spacing */
    font-size: 10px; /* Adjust font size */
    white-space: nowrap; /* Prevent wrapping of line numbers */
  }

  div.odd {
    display: flex;
    align-items: center;
    color: #424242;
    background-color: #e3e3e3;
    opacity: 0.8;
    justify-content: flex-start; /* Align numbers to the right */
    padding-right: 4px; /* Add right padding for spacing */
    font-size: 10px; /* Adjust font size */
    white-space: nowrap; /* Prevent wrapping of line numbers */
  }

  div.content-container {
    flex: initial;
    overflow: hidden;
  }

  div.content {
    height: 150px;
    width: fit-content;
    padding-left: 4px;
    border: 1px solid #4caf50;
    overflow-y: scroll; /* Enable vertical scrolling */
    font-size: 12px; /* Match font size with line numbers */
    line-height: 14px; /* Match line height with line numbers */
    font-family: monospace /* Ensure fixed-width font for byte content */;
  }

  /* Hide scrollbar by default on webkit-based browsers */
  div.hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
</style>
