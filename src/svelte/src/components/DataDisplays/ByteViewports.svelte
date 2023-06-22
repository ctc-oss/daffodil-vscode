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
    viewportColumnWidth,
  } from '../../stores'
  import {
    ViewportData_t,
    _viewportData,
    processingViewportRefresh,
  } from './CustomByteDisplay/BinaryData'

  export let addressRadix = 16
  export let displayRadix = 16
  export let bytesPerRow = 16
  export let startOffset = 0
  export let byteData = new Uint8Array()
  export let nonPrintableStandIn = String.fromCharCode(9617)
  export let viewportData: ViewportData_t

  let addresses: Array<string>
  let gutterContainer: HTMLDivElement
  let physicalContainer: HTMLDivElement
  let logicalContainer: HTMLDivElement
  let viewportElementContainer: HTMLDivElement
  let fireScrollBoundaryEvent = true

  const eventDispatcher = createEventDispatcher()

  // Address generation for the gutter
  $: {
    addresses = Array.from(
      {
        length: Math.ceil(
          (viewportData.fileOffset + viewportData.length) / bytesPerRow
        ),
      },
      (_, i) =>
        (i * bytesPerRow + viewportData.fileOffset)
          .toString(addressRadix)
          .toUpperCase()
    )
  }
  function syncScroll(element: HTMLDivElement) {
    $viewportScrollTop = element.scrollTop
    $viewportScrollHeight = element.scrollHeight
    $viewportClientHeight = element.clientHeight

    // switch (element.id) {
    //   case 'gutter':
    //     physicalContainer.scrollTop = $viewportScrollTop
    //     logicalContainer.scrollTop = $viewportScrollTop
    //     break
    //   case 'physical':
    //     gutterContainer.scrollTop = $viewportScrollTop
    //     logicalContainer.scrollTop = $viewportScrollTop
    //     break
    //   case 'logical':
    //     gutterContainer.scrollTop = $viewportScrollTop
    //     physicalContainer.scrollTop = $viewportScrollTop
    //     break
    // }

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
    viewportElementContainer.addEventListener('scroll', () => {
      syncScroll(viewportElementContainer)
    })
    // gutterContainer.addEventListener('scroll', () =>
    //   syncScroll(gutterContainer)
    // )
    // physicalContainer.addEventListener('scroll', () =>
    //   syncScroll(physicalContainer)
    // )
    // logicalContainer.addEventListener('scroll', () =>
    //   syncScroll(logicalContainer)
    // )
  })
</script>

<div
  class="container hide-scrollbar"
  style="grid-template-columns: 80pt calc({$viewportColumnWidth}px) calc({$viewportColumnWidth}px)"
  bind:this={viewportElementContainer}
>
  <div class="gutter hide-scrollbar" id="gutter" bind:this={gutterContainer}>
    {#each addresses as address, i}
      <div class={i % 2 === 0 ? 'even' : 'odd'}>{address}</div>
    {/each}
  </div>
  <BinaryDisplayContainer
    id={'physical'}
    bind:boundContainerId={physicalContainer}
  />
  <LogicalDisplayContainer
    id={'logical'}
    bind:boundContainerId={logicalContainer}
  />
</div>

<style>
  div.container {
    display: grid;
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 3;
    grid-row-end: 5;
    overflow-y: scroll;
    overflow-x: hidden;
  }

  div.header {
    font-size: 14px;
    font-weight: bold;
    padding: 2px;
    background-color: #8094d7;
    text-align: center; /* Center the header text */
  }

  div.gutter {
    border: 1px solid #2849b9;
    /* overflow-y: scroll; */
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
