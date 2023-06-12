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
  export let data: number[] = []
  export let title: string

  let currentTooltip: { index: number; value: number } | null = null
  let colorScaleData: string[] = []
  let scaledData: number[] = []
  let sum: number = 0
  let maxValue: number = 0
  let mean: number = 0
  let stdDev: number = 0
  let numAscii: number = 0

  function calculateNumAscii(profile: number[]): number {
    return profile.slice(0, 128).reduce((accumulator, current) => {
      return accumulator + current
    }, 0)
  }

  $: {
    sum = data.reduce((a, b) => a + b, 0)
    mean = sum / data.length
    maxValue = Math.max(...data)

    let squareDiffs = data.map((value) => Math.pow(value - mean, 2))
    let avgSquareDiff =
      squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length
    stdDev = Math.sqrt(avgSquareDiff)

    colorScaleData = data.map((value) => {
      if (value < mean - stdDev) return 'low'
      if (value > mean + stdDev) return 'high'
      return 'average'
    })

    scaledData = data.map((d) => Math.round((d / maxValue) * 300)) // 300 is the max height of the chart
    numAscii = calculateNumAscii(data)
  }

  function handleDownload(): void {
    const csvContent =
      'Byte,Frequency\n' + data.map((val, idx) => `${idx},${val}`).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'data.csv'
    link.click()
  }
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
        Byte: {currentTooltip.index}, Frequency: {data[currentTooltip.index]}
      </div>
    {/if}
  </div>
  <div>
    Max Value: {maxValue}<br />
    Mean Frequency: {mean.toFixed(2)}<br />
    Standard Deviation: {stdDev.toFixed(2)}<br />
    Number Of Bytes: {sum}<br />
    Number Of ASCII Bytes: {numAscii}<br />
    Percentage Of ASCII Bytes: {((numAscii / sum) * 100).toFixed(2)}%
  </div>
  <Button fn={handleDownload}>
    <span slot="left" class="btn-icon">&#x25BC;</span>
    <span slot="default">&nbsp;Download Profile as CSV</span></Button>
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
