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
  import { onMount, createEventDispatcher } from 'svelte'
  import BinaryDisplayContainer from './CustomByteDisplay/BinaryDisplayContainer.svelte'
  import LogicalDisplayContainer from './CustomByteDisplay/LogicalDisplayContainer.svelte'
  import BinaryValueActions from './CustomByteDisplay/BinaryValueActions.svelte'
  import {
    viewportScrollTop,
    viewportScrollHeight,
    viewportClientHeight,
  } from '../../stores'

  export let addressRadix = 16
  export let displayRadix = 16
  export let bytesPerRow = 16
  export let startOffset = 0
  export let byteData = new Uint8Array()
  export let nonPrintableStandIn = String.fromCharCode(9617)

  let gutterContainer: HTMLDivElement
  let physicalContainer: HTMLDivElement
  let logicalContainer: HTMLDivElement
  let fireScrollBoundaryEvent = true

  const eventDispatcher = createEventDispatcher()

  // Address generation for the gutter
  $: addresses = Array.from(
    {
      length: Math.ceil((startOffset + byteData.length) / bytesPerRow),
    },
    (_, i) => (i * bytesPerRow).toString(addressRadix).toUpperCase()
  )

  function syncScroll(element: HTMLDivElement) {
    $viewportScrollTop = element.scrollTop
    $viewportScrollHeight = element.scrollHeight
    $viewportClientHeight = element.clientHeight

    switch (element.id) {
      case 'gutter':
        physicalContainer.scrollTop = $viewportScrollTop
        logicalContainer.scrollTop = $viewportScrollTop
        break
      case 'physical':
        gutterContainer.scrollTop = $viewportScrollTop
        logicalContainer.scrollTop = $viewportScrollTop
        break
      case 'logical':
        gutterContainer.scrollTop = $viewportScrollTop
        physicalContainer.scrollTop = $viewportScrollTop
        break
    }

    // check if scrolled to the top or bottom, we only do this for one of
    // the viewports so the event is fired once rather than three times
    const scrolledTop = $viewportScrollTop === 0
    const scrolledEnd =
      Math.ceil($viewportScrollTop) + $viewportClientHeight ===
      $viewportScrollHeight
    if ((scrolledTop && !scrolledEnd) || (scrolledEnd && !scrolledTop)) {
      if (fireScrollBoundaryEvent) {
        fireScrollBoundaryEvent = false
        setTimeout(() => (fireScrollBoundaryEvent = true), 100)
        // fire scrollBoundary event when scrolled to the top or bottom
        eventDispatcher('scrollBoundary', { scrolledTop, scrolledEnd })
      }
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

  const custom_commit_changes = () => {
    eventDispatcher('custom-commit-changes')
  }
  const handleEditorEvent = () => {
    eventDispatcher('handleEditorEvent')
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

  // const isDemo = false
</script>

<div class="container">
  <div class="gutter hide-scrollbar" id="gutter" bind:this={gutterContainer}>
    {#each addresses as address, i}
      <div class={i % 2 === 0 ? 'even' : 'odd'}>{address}</div>
    {/each}
  </div>
  <!-- </div>

  <div class="content-container">
    <div class="header">Physical</div>
    {#if isDemo}
      <div
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
      </div>
      {:else}
        <BinaryDisplayContainer id={"physical"} bind:boundContainerId={physicalContainer} />
      {/if}
  </div>

  <div class="content-container">
    <div class="header">Logical</div>
    {#if isDemo}
    <div
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
    </div>
      {:else}
        <LogicalDisplayContainer id={"logical"} bind:boundContainerId={logicalContainer} />
      {/if}
  </div> -->
  <BinaryDisplayContainer
    id={'physical'}
    bind:boundContainerId={physicalContainer}
  />
  <LogicalDisplayContainer
    id={'logical'}
    bind:boundContainerId={logicalContainer}
  />
</div>

<!-- <hr /> -->
<!-- <div class="debug">
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
  isDemo: {isDemo}<br />
</div> -->

<!-- <hr /> -->
<style>
  div.container {
    display: flex;
    grid-column-start: 1;
    grid-column-end: 4;
    overflow-y: scroll;
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
    border: 1px solid #2849b9;
    overflow-y: scroll;
    overflow-x: hidden; /* Prevent horizontal scrolling */
    direction: rtl; /* Move line numbers to the right side */
    line-height: 14px; /* Match line height with content */
    grid-row-start: 3;
    grid-row-end: 5;
    grid-column: 1;
  }

  div.even,
  div.odd {
    display: flex;
    align-items: center;
    color: #424242;
    opacity: 0.8;
    justify-content: flex-start; /* Align numbers to the right */
    padding-right: 4px; /* Add right padding for spacing */
    font-size: 13px; /* Adjust font size */
    height: 24px;
    white-space: nowrap; /* Prevent wrapping of line numbers */
  }
  div.even {
    background-color: #f3f3f3;
  }
  div.odd {
    background-color: #e3e3e3;
  }
</style>
