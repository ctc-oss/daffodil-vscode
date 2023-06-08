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
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte'

  export let byteContent
  export let startLine
  export let bytesPerLine

  let gutterContainer: HTMLElement
  let physicalContainer: HTMLElement
  let logicalContainer: HTMLElement

  const eventDispatcher = createEventDispatcher()

  $: endLine = startLine + Math.ceil(byteContent.length / bytesPerLine) - 1

  function syncScroll(element: HTMLElement) {
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

  function renderHex(byteArray: number[]): string {
    return byteArray.map((byte) => byte.toString(16).padStart(2, '0')).join(' ')
  }

  function renderLatin1(byteArray: number[]): string {
    return byteArray
      .map((byte) => {
        const charCode = byte >= 32 && byte <= 126 ? byte : 183 // Use a bullet (•) for non-printable characters
        return String.fromCharCode(charCode)
      })
      .join(' ')
  }

  onMount(() => {
    const gutterContainer = document.getElementById('gutter')
    const physicalContainer = document.getElementById('physical')
    const logicalContainer = document.getElementById('logical')

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
    <div
      class="gutter hide-scrollbar"
      id="gutter"
      onscroll="syncScroll($event.target)"
    >
      {#each Array.from({ length: $endLine - $startLine + 1 }, (_, i) => $startLine + i) as line}
        {#if line % 2 === 0}
          <b>{line}</b>
        {:else}
          <a>{line}</a>
        {/if}
      {/each}
    </div>
  </div>

  <div class="content-container">
    <div class="header">Physical</div>
    <div class="content hide-scrollbar" id="physical">
      {#each Array.from( { length: Math.ceil(byteContent.length / bytesPerLine) } ) as _, i}
        <div>
          {#if i + $startLine <= $endLine}
            {#each byteContent.slice(i * bytesPerLine, (i + 1) * bytesPerLine) as byte}
              {renderHex([byte]) + ' '}
            {/each}
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div class="content-container">
    <div class="header">Logical</div>
    <div class="content hide-scrollbar" id="logical">
      {#each Array.from( { length: Math.ceil(byteContent.length / bytesPerLine) } ) as _, i}
        <div>
          {#if i + $startLine <= $endLine}
            {#each byteContent.slice(i * bytesPerLine, (i + 1) * bytesPerLine) as byte}
              {renderLatin1([byte]) + ' '}
            {/each}
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .container {
    display: flex;
  }

  .header {
    font-size: 14px;
    font-weight: bold;
    padding: 2px;
    background-color: #8094d7;
    text-align: center; /* Center the header text */
  }

  .gutter {
    width: 96px;
    height: 150px;
    border: 1px solid #2849b9;
    overflow-y: scroll;
    overflow-x: hidden; /* Prevent horizontal scrolling */
    direction: rtl; /* Move line numbers to the right side */
    line-height: 14px; /* Match line height with content */
  }

  a {
    display: flex;
    align-items: center;
    color: #424242;
    background-color: #f3f3f3;
    opacity: 0.8;
    justify-content: flex-start; /* Align numbers to the right */
    padding-right: 4px; /* Add right padding for spacing */
    font-size: 10px; /* Adjust font size */
    font-weight: normal; /* Remove bold font weight */
    white-space: nowrap; /* Prevent wrapping of line numbers */
  }

  b {
    display: flex;
    align-items: center;
    color: #424242;
    background-color: #e3e3e3;
    opacity: 0.8;
    justify-content: flex-start; /* Align numbers to the right */
    padding-right: 4px; /* Add right padding for spacing */
    font-size: 10px; /* Adjust font size */
    font-weight: normal; /* Remove bold font weight */
    white-space: nowrap; /* Prevent wrapping of line numbers */
  }

  .content-container {
    flex: initial;
    overflow: hidden;
  }

  .content {
    height: 150px;
    width: 300px;
    padding-left: 4px;
    border: 1px solid #4caf50;
    overflow-y: scroll; /* Enable vertical scrolling */
    font-size: 12px; /* Match font size with line numbers */
    line-height: 14px; /* Match line height with line numbers */
    font-family: monospace /* Ensure fixed-width font for byte content */;
  }

  /* Hide scrollbar by default on webkit-based browsers */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
</style>
