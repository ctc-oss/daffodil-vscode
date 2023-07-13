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
  import Button from '../Inputs/Buttons/Button.svelte'
  import { vscode } from '../../utilities/vscode'
  import { MessageCommand } from '../../utilities/message'
  import { onMount } from 'svelte'
  import Input from '../Inputs/Input/Input.svelte'
  import { offsetMax } from '../DataDisplays/CustomByteDisplay/BinaryData'

  // title for the byte profile graph
  export let title: string

  // start offset for the byte profile graph
  export let startOffset: number

  // number of bytes to profile from the start offset
  export let length: number

  let endOffset: number = 0
  let byteProfile: number[] = []
  let currentTooltip: { index: number; value: number } | null = null
  let colorScaleData: string[] = []
  let scaledData: number[] = []
  let sum: number = 0
  let minFrequency: number = 0
  let maxFrequency: number = 0
  let mean: number = 0
  let variance: number = 0
  let stdDev: number = 0
  let numAscii: number = 0
  let isEditing = ''
  let message = ''
  let messageTimeout: number | null = null
  let asciiOverlay = true

  $: {
    sum = byteProfile.reduce((a, b) => a + b, 0)
    mean = sum / byteProfile.length
    minFrequency = Math.min(...byteProfile)
    maxFrequency = Math.max(...byteProfile)

    let squareDiffs = byteProfile.map((value) => Math.pow(value - mean, 2))
    variance = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length
    stdDev = Math.sqrt(variance)

    colorScaleData = byteProfile.map((value) => {
      if (value < mean - stdDev) return 'low'
      if (value > mean + stdDev) return 'high'
      return 'average'
    })

    scaledData = byteProfile.map((d) => Math.round((d / maxFrequency) * 300)) // 300 is the max height of the chart
  }

  function setMessage(msg: string, timeout: number = 5000) {
    // Clear timeout if it exists
    if (messageTimeout) clearTimeout(messageTimeout)
    message = msg
    // Timeout message after 5 seconds
    if (timeout > 0) {
      messageTimeout = setTimeout(() => {
        message = ''
      }, timeout)
    }
  }

  function handleCsvProfileDownload(): void {
    const csvContent =
      'Byte,Frequency\n' +
      byteProfile.map((val, idx) => `${idx},${val}`).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'profile-data.csv'
    link.click()
  }

  function requestSessionProfile(startOffset: number, length: number) {
    setMessage(
      `Profiling bytes from ${startOffset} to ${startOffset + length}...`,
      0
    )
    vscode.postMessage({
      command: MessageCommand.profile,
      data: {
        startOffset: startOffset,
        length: length,
      },
    })
  }

  function handleInputEnter(e: CustomEvent) {
    switch (e.detail.id) {
      case 'start-offset-input':
        {
          const temp = parseInt(e.detail.value)
          if (isNaN(temp)) {
            setMessage('Start offset must be a decimal number')
          } else if (temp < 0) {
            setMessage('Start offset must be greater than or equal to 0')
            return
          } else if (temp >= endOffset) {
            setMessage('Start offset must be less than end offset')
            return
          }
          startOffset = temp
          length = endOffset - startOffset
        }
        break
      case 'end-offset-input':
        {
          const temp = parseInt(e.detail.value)
          if (isNaN(temp)) {
            setMessage('End offset must be a decimal number')
          } else if (temp <= startOffset) {
            setMessage('End offset must be greater than start offset')
            return
          } else if (temp > $offsetMax) {
            setMessage(`End offset must be less than or equal to ${$offsetMax}`)
            return
          }
          endOffset = temp
          length = endOffset - startOffset
        }
        break
      case 'length-input':
        {
          const temp = parseInt(e.detail.value)
          if (isNaN(temp)) {
            setMessage('Length must be a decimal number')
          } else if (temp <= 0) {
            setMessage('Length must be greater than 0')
            return
          } else if (temp > $offsetMax - startOffset) {
            setMessage(
              `Length must be less than or equal to ${$offsetMax - startOffset}`
            )
            return
          }
          length = temp
          endOffset = startOffset + length
        }
        break
      default:
        break
    }
    isEditing = ''
    requestSessionProfile(startOffset, length)
  }
  function handleBlur() {
    isEditing = ''
  }

  onMount(() => {
    // Handle messages sent from the extension to the webview
    window.addEventListener('message', (msg) => {
      switch (msg.data.command) {
        case MessageCommand.profile:
          numAscii = msg.data.data.numAscii as number
          byteProfile = msg.data.data.byteProfile as number[]
          console.assert(byteProfile.length === 256)
          console.assert(startOffset === msg.data.data.startOffset)
          console.assert(length === msg.data.data.length)
          setMessage(
            `Profiled bytes from ${startOffset} to ${startOffset + length}`
          )
          break
        default:
          break // do nothing
      }
    })
    endOffset = startOffset + length
    requestSessionProfile(startOffset, length)
  })
</script>

<div class="container">
  {#if title.length > 0}
    <div class="header">
      <h3>{title}</h3>
    </div>
  {/if}
  <div class="chart">
    {#if asciiOverlay}
      <div class="ascii-control-overlay">
        <div class="overlay-title">ctrl</div>
      </div>
      <div class="printable-ascii-overlay">
        <div class="overlay-title">printable</div>
      </div>
      <div class="ascii-control2-overlay" />
    {/if}
    {#each scaledData as value, i (i)}
      <div
        class="bar {colorScaleData[i]}"
        style="height: {value}px;"
        on:mouseenter={() => (currentTooltip = { index: i, value })}
        on:mouseleave={() => (currentTooltip = null)}
      />
    {/each}
    {#if currentTooltip}
      <div class="tooltip" style="bottom: {currentTooltip.value}px;">
        Byte: {currentTooltip.index}, Frequency: {byteProfile[
          currentTooltip.index
        ]}
      </div>
    {/if}
  </div>
  <div class="message">&nbsp;{message}&nbsp;</div>
  <div>
    <div class="input-container">
      <label for="ascii-overlay-toggle"
        >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Overlay:
        <span
          id="ascii-overlay-toggle"
          class="editable"
          on:click={() => {
            asciiOverlay = !asciiOverlay
          }}>{asciiOverlay ? 'On' : 'Off'}</span
        >
      </label>
    </div>
    {#if isEditing === 'startOffset'}
      <div class="input-container">
        <label for="start-offset-input" class="label"
          >Start Offset:
          <Input
            id="start-offset-input"
            placeholder={startOffset}
            value={startOffset}
            on:inputEnter={handleInputEnter}
            on:inputFocusOut={handleBlur}
            width="20ch"
            autofocus="true"
          />
        </label>
      </div>
    {:else}
      <div
        on:click={() => {
          isEditing = 'startOffset'
        }}
      >
        <label for="start-offset"
          >Start Offset: <span id="start-offset" class="editable"
            >{startOffset}</span
          ></label
        >
      </div>
    {/if}
    {#if isEditing === 'endOffset'}
      <div class="input-container">
        <label for="end-offset-input" class="label"
          >&nbsp;&nbsp;End Offset:
          <Input
            id="end-offset-input"
            placeholder={endOffset}
            value={endOffset}
            on:inputEnter={handleInputEnter}
            on:inputFocusOut={handleBlur}
            width="20ch"
            autofocus="true"
          />
        </label>
      </div>
    {:else}
      <div
        on:click={() => {
          isEditing = 'endOffset'
        }}
      >
        <label for="end-offset"
          >&nbsp;&nbsp;End Offset: <span id="end-offset" class="editable"
            >{endOffset}</span
          ></label
        >
      </div>
    {/if}
    {#if isEditing === 'length'}
      <div class="input-container">
        <label for="length-input" class="label"
          >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Length:
          <Input
            id="length-input"
            placeholder={length}
            value={length}
            on:inputEnter={handleInputEnter}
            on:inputFocusOut={handleBlur}
            width="20ch"
            autofocus="true"
          />
        </label>
      </div>
    {:else}
      <div
        on:click={() => {
          isEditing = 'length'
        }}
      >
        <label for="length"
          >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Length: <span
            id="length"
            class="editable">{length}</span
          ></label
        >
      </div>
    {/if}
    <Button fn={handleCsvProfileDownload}>
      <span slot="left" class="btn-icon material-symbols-outlined"
        >download</span
      >
      <span slot="default">Profile&nbsp;as&nbsp;CSV</span></Button
    >
  </div>
  <hr />
  <div class="stats">
    <label for="computed-size"
      >&nbsp;Max Offset: <span id="computed-size" class="nowrap"
        >{$offsetMax}</span
      ></label
    >
    <label for="min-frequency"
      >&nbsp;&nbsp;Min Freq.: <span id="min-frequency" class="nowrap"
        >{minFrequency}</span
      ></label
    >
    <label for="max-frequency"
      >&nbsp;&nbsp;Max Freq.: <span id="max-frequency" class="nowrap"
        >{maxFrequency}</span
      ></label
    >
    <label for="mean-frequency"
      >&nbsp;Mean Freq.: <span id="mean-frequency" class="nowrap"
        >{mean.toFixed(2)}</span
      ></label
    >
    <label for="variance"
      >&nbsp;&nbsp;&nbsp;Variance: <span id="variance" class="nowrap"
        >{variance.toFixed(2)}</span
      ></label
    >
    <label for="stddev"
      >&nbsp;&nbsp;Std. Dev.: <span id="stddev" class="nowrap"
        >{stdDev.toFixed(2)}</span
      ></label
    >
    <label for="byte-count"
      >&nbsp;Byte Count: <span id="byte-count" class="nowrap">{sum}</span
      ></label
    >
    <label for="ascii-count"
      >ASCII Count: <span id="ascii-count" class="nowrap">{numAscii}</span
      ></label
    >
    <label for="ascii-percent"
      >&nbsp;&nbsp;&nbsp;&nbsp;% ASCII: <span id="ascii-percent" class="nowrap"
        >{((numAscii / sum) * 100).toFixed(2)}</span
      >
    </label>
  </div>
  <hr />
</div>

<style lang="scss">
  div.container {
    position: relative;
    justify-content: center;
    width: 260px;
    height: 308px;
  }

  div.header {
    text-align: center;
  }

  div.chart {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
    height: 100%;
    padding: 2px;
    box-sizing: border-box;
    border: 1px solid gray;
    position: relative;
    opacity: 0.9;
  }

  div.printable-ascii-overlay {
    position: absolute;
    bottom: 0;
    /* Printable ASCII byte range is from 32 to 126 */
    /* startByte / totalBytes * 100% */
    left: calc(32 / 256 * 100%);
    /* endByte / totalBytes * 100% - startByte / totalBytes * 100% */
    width: calc((126 / 256 * 100%) - (32 / 256 * 100%));
    height: 100%;
    background-color: navy;
    opacity: 0.5;
    z-index: -1;
  }
  div.ascii-control-overlay {
    position: absolute;
    bottom: 0;
    /* ASCII control byte range is from 0 to 31 */
    left: 0;
    width: calc(31 / 256 * 100%);
    height: 100%;
    background-color: midnightblue;
    opacity: 0.5;
    z-index: -1;
  }
  div.ascii-control2-overlay {
    position: absolute;
    bottom: 0;
    left: calc(127 / 251 * 100%);
    width: calc(1 / 256 * 100%);
    height: 100%;
    background-color: midnightblue;
    opacity: 0.5;
    z-index: -1;
  }
  div.overlay-title {
    text-align: center;
    font-size: 0.75em;
    color: skyblue;
    opacity: 0.75;
  }

  div.bar {
    width: 1px;
    background-color: gray;
  }

  div.bar.low {
    background-color: limegreen;
  }

  div.bar.average {
    background-color: yellow;
  }

  div.bar.high {
    background-color: red;
  }

  div.tooltip {
    position: absolute;
    padding: 5px 10px;
    background-color: #afafaf;
    color: black;
    border: 1px solid blue;
    pointer-events: none;
    opacity: 0.75;
  }

  div.message {
    text-align: center;
    font-size: 0.75em;
    color: green;
  }
</style>
