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
  import { onMount, createEventDispatcher, tick } from 'svelte'
  import BinaryDisplayContainer from './CustomByteDisplay/BinaryDisplayContainer.svelte'
  import LogicalDisplayContainer from './CustomByteDisplay/LogicalDisplayContainer.svelte'

  export let addressRadix = 16
  export let displayRadix = 16
  export let bytesPerRow = 16
  export let startOffset = 0
  export let byteData = new Uint8Array()
  export let nonPrintableStandIn = String.fromCharCode(9617)

  let gutterContainer: HTMLDivElement
  let physicalContainer: HTMLDivElement
  let logicalContainer: HTMLDivElement

  let scrollTop: number
  let scrollHeight: number
  let clientHeight: number
  let scrolledTop: boolean
  let scrolledEnd: boolean

  const eventDispatcher = createEventDispatcher()

  // Address generation for the gutter
  $: addresses = Array.from(
    {
      length: Math.ceil((startOffset + byteData.length) / bytesPerRow),
    },
    (_, i) => (i * bytesPerRow).toString(addressRadix).toUpperCase()
  )

  function syncScroll(element: HTMLDivElement) {
    scrollTop = element.scrollTop
    scrollHeight = element.scrollHeight
    clientHeight = element.clientHeight

    switch (element.id) {
      case 'gutter':
        {
          physicalContainer.scrollTop = scrollTop
          logicalContainer.scrollTop = scrollTop

          // check if scrolled to the top or bottom, we only do this for one of
          // the viewports so the event is fired once rather than three times
          scrolledTop = scrollTop === 0
          scrolledEnd = Math.ceil(scrollTop) + clientHeight === scrollHeight
          if ((scrolledTop && !scrolledEnd) || (scrolledEnd && !scrolledTop)) {
            // fire scrollBoundary event when scrolled to the top or bottom
            eventDispatcher('scrollBoundary', { scrolledTop, scrolledEnd })
          }
        }
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
  }

  function renderByte(byteArray: number[]): string {
    return byteArray
      .map((byte) => byte.toString(displayRadix).toUpperCase().padStart(2, '0'))
      .join(' ')
  }

  function renderLatin1(byteArray: number[]): string {
    return byteArray
      .map((byte) => {
        return byte >= 32 && byte <= 126
          ? String.fromCharCode(byte)
          : nonPrintableStandIn
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
    <BinaryDisplayContainer id={"physical"} bind:boundContainerId={physicalContainer} />
    <!-- <div
      class="content hide-scrollbar"
      id="physical"
      bind:this={physicalContainer}
    >
      {#each Array.from( { length: Math.ceil(byteData.length / bytesPerRow) } ) as _, i}
        <div>
          {#each byteData.slice(i * bytesPerRow, (i + 1) * bytesPerRow) as byte}
            {renderByte([byte]) + ' '}
          {/each}
        </div>
      {/each}
    </div> -->
  </div>

  <div class="content-container">
    <div class="header">Logical</div>
    <LogicalDisplayContainer id={"logical"} bind:boundContainerId={logicalContainer} />
    <!-- <div
      class="content hide-scrollbar"
      id="logical"
      bind:this={logicalContainer}
    >
      {#each Array.from( { length: Math.ceil(byteData.length / bytesPerRow) } ) as _, i}
        <div>
          {#each byteData.slice(i * bytesPerRow, (i + 1) * bytesPerRow) as byte}
            {renderLatin1([byte]) + ' '}
          {/each}
        </div>
      {/each}
    </div> -->
  </div>
</div>

<hr />
<div>
  startOffset: {startOffset}<br />
  bytesPerRow: {bytesPerRow}<br />
  addressRadix: {addressRadix}<br />
  displayRadix: {displayRadix}<br />
  nonPrintableStandIn: {nonPrintableStandIn}<br />
  byteData: {byteData}<br />
  scrolledTop: {scrolledTop}<br />
  scrolledEnd: {scrolledEnd}<br />
  scrollTop: {scrollTop}<br />
  scrollHeight: {scrollHeight}<br />
  clientHeight: {clientHeight}<br />
</div>
<hr />

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

  div.even, div.odd {
    display: flex;
    align-items: center;
    color: #424242;
    opacity: 0.8;
    justify-content: flex-start; /* Align numbers to the right */
    padding-right: 4px; /* Add right padding for spacing */
    font-size: 10px; /* Adjust font size */
    height: 24px;
    white-space: nowrap; /* Prevent wrapping of line numbers */
  }
  div.even {
    background-color: #f3f3f3;
  }
  div.odd {
    background-color: #e3e3e3;
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
