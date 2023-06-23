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
  import {
    viewportScrollTop,
    viewportScrollHeight,
    viewportClientHeight,
    viewportColumnWidth,
  } from '../../stores'
  import {
    VIEWPORT_SCROLL_INCREMENT,
    ViewportBoundaryTrigger,
    ViewportData_t,
    _viewportData,
    scroll_boundary_event,
  } from './CustomByteDisplay/BinaryData'
  import { MessageCommand } from '../../utilities/message'
  import { fileMetrics } from '../Header/fieldsets/FileMetrics'
  import { vscode } from '../../utilities/vscode'

  export let addressRadix = 16
  export let bytesPerRow = 16
  export let viewportData: ViewportData_t

  let addresses: Array<string>
  let viewportElementContainer: HTMLDivElement
  let sendViewportScrollEvent: NodeJS.Timeout
  let viewportRefreshable = true

  const eventDispatcher = createEventDispatcher()

  let scrollTimeoutFunc: NodeJS.Timeout
  const SCROLL_TIMEOUT_MS = 150
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

    // check if scrolled to the top or bottom, we only do this for one of
    // the viewports so the event is fired once rather than three times
    const scrolledTop = $viewportScrollTop === 0
    const scrolledEnd =
      Math.ceil($viewportScrollTop) + $viewportClientHeight ===
      $viewportScrollHeight
    const atFileHeadBoundary =
      viewportData.fileOffset - VIEWPORT_SCROLL_INCREMENT < 0
    const atFileTailBoundary =
      viewportData.fileOffset + VIEWPORT_SCROLL_INCREMENT >
      $fileMetrics.diskSize

    if (
      (scrolledTop && !scrolledEnd && !atFileHeadBoundary) ||
      (scrolledEnd && !scrolledTop && !atFileTailBoundary)
    ) {
      if (viewportRefreshable) {
        viewportRefreshable = false
        setTimeout(() => (viewportRefreshable = true), 500)
        const boundary_trigger = scroll_boundary_event(scrolledTop, scrolledEnd)
        const offset =
          boundary_trigger === ViewportBoundaryTrigger.SCROLL_TOP
            ? viewportData.fileOffset - VIEWPORT_SCROLL_INCREMENT
            : viewportData.fileOffset + VIEWPORT_SCROLL_INCREMENT

        vscode.postMessage({
          command: MessageCommand.scrollViewport,
          data: {
            scrollOffset: offset,
            bytesPerRow: bytesPerRow,
          },
        })
      }
    }
  }
  onMount(() => {
    viewportElementContainer.addEventListener('wheel', (event) => {
      // For some reason clicks are also registering as "scroll"s ?
      console.log(event)
      syncScroll(viewportElementContainer)
    })
  })
  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.viewportRefresh:
        // the viewport has been refreshed, so the editor views need to be updated
        viewportData = {
          data: msg.data.data.viewportData,
          fileOffset: msg.data.data.viewportOffset,
          length: msg.data.data.viewportLength,
          bytesLeft: msg.data.data.viewportFollowingByteCount,
        } as ViewportData_t

        // console.table($viewportData_t)

        // $_viewportData = msg.data.data.viewportData
        // $viewportData = msg.data.data.viewportData
        // $viewportStartOffset = msg.data.data.viewportOffset
        // $viewportLength = msg.data.data.viewportLength
        // $viewportFollowingByteCount = msg.data.data.viewportFollowingByteCount
        // $viewportCapacity = msg.data.data.viewportCapacity

        break
    }
  })
</script>

<div
  class="container hide-scrollbar"
  style="grid-template-columns: 80pt calc({$viewportColumnWidth}px) calc({$viewportColumnWidth}px)"
  bind:this={viewportElementContainer}
>
  <div class="gutter hide-scrollbar" id="gutter">
    {#each addresses as address, i}
      <div class={i % 2 === 0 ? 'even' : 'odd'}>{address}</div>
    {/each}
  </div>
  <BinaryDisplayContainer id={'physical'} />
  <LogicalDisplayContainer id={'logical'} />
</div>

<style>
  button {
    padding: 0;
    margin: 0;
    border: 0;
    position: absolute;
    left: 0;
    top: 0;
  }
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
    /* border: 1px solid #2849b9; */
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
