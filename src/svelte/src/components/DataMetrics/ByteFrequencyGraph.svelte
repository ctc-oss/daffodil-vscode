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
  import { offsetMax } from '../../stores'
  import { vscode } from '../../utilities/vscode'
  import { MessageCommand } from '../../utilities/message'
  import { onMount } from 'svelte'
  export let title: string
  export let startOffset: number
  export let endOffset: number

  let byteProfile: number[] = []

  function profileSession(startOffset: number, endOffset: number) {
    vscode.postMessage({
      command: MessageCommand.profile,
      data: {
        startOffset: startOffset,
        endOffset: endOffset,
      },
    })
  }

  let currentTooltip: { index: number; value: number } | null = null
  let colorScaleData: string[] = []
  let scaledData: number[] = []
  let sum: number = 0
  let maxFrequency: number = 0
  let mean: number = 0
  let stdDev: number = 0
  let numAscii: number = 0

  function handleDownload(): void {
    const csvContent =
      'Byte,Frequency\n' +
      byteProfile.map((val, idx) => `${idx},${val}`).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'data.csv'
    link.click()
  }

  $: {
    sum = byteProfile.reduce((a, b) => a + b, 0)
    mean = sum / byteProfile.length
    maxFrequency = Math.max(...byteProfile)

    let squareDiffs = byteProfile.map((value) => Math.pow(value - mean, 2))
    let avgSquareDiff =
      squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length
    stdDev = Math.sqrt(avgSquareDiff)

    colorScaleData = byteProfile.map((value) => {
      if (value < mean - stdDev) return 'low'
      if (value > mean + stdDev) return 'high'
      return 'average'
    })

    scaledData = byteProfile.map((d) => Math.round((d / maxFrequency) * 300)) // 300 is the max height of the chart
  }

  onMount(() => {
    window.addEventListener('message', (msg) => {
      switch (msg.data.command) {
        case MessageCommand.profile:
          byteProfile = msg.data.data.byteProfile
          numAscii = msg.data.data.numAscii
          break
        default:
          break // do nothing
      }
    })

    profileSession(startOffset, endOffset)
  })
</script>

<div class="container">
  {#if title.length > 0}
    <div class="header">
      <h3>{title}</h3>
    </div>
  {/if}
  <div class="chart">
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
  <div>
    <label for="start-offset"
      >Start Offset: <span id="start-offset">{startOffset}</span></label
    ><br />
    <label for="end-offset"
      >End Offset: <span id="end-offset">{endOffset}</span></label
    ><br />
    <label for="max-frequency"
      >Max Frequency: <span id="max-frequency">{maxFrequency}</span></label
    ><br />
    <label for="mean-frequency"
      >Mean Frequency: <span id="mean-frequency">{mean.toFixed(2)}</span></label
    ><br />
    <label for="stddev"
      >Standard Deviation: <span id="stddev">{stdDev.toFixed(2)}</span></label
    ><br />
    <label for="byte-count"
      >Byte Count: <span id="byte-count">{sum}</span></label
    ><br />
    <label for="ascii-count"
      >ASCII Byte Count: <span id="ascii-count">{numAscii}</span></label
    ><br />
    <label for="ascii-percent"
      >Percentage ASCII: <span id="ascii-percent"
        >{((numAscii / sum) * 100).toFixed(2)}%</span
      ></label
    ><br />
  </div>
  <Button fn={handleDownload}>
    <span slot="left" class="btn-icon">&#x25BC;</span>
    <span slot="default">&nbsp;Download Profile as CSV</span></Button
  >
</div>

<style>
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
</style>
