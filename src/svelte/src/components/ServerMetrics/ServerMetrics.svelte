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
  import { MessageCommand } from '../../utilities/message'
  import FlexContainer from '../layouts/FlexContainer.svelte'

  let omegaEditPort: number
  let serverVersion: string = 'Unknown'
  let serverLatency: number
  let serverCpuLoadAvg: number
  let serverUsedMemory: number
  let serverUptime: number
  let sessionCount: number
  let displayInfo: boolean = false

  function toggleDisplay(_: Event) {
    let textDiv: HTMLDivElement = get_text_element_ref()

    if (displayInfo) {
      displayInfo = false
      textDiv.style.opacity = '0'
      return
    }
    displayInfo = true
    textDiv.style.opacity = '.7'
  }
  function get_text_element_ref(): HTMLDivElement {
    return document.getElementsByClassName(
      'heartbeat-text'
    )[0] as HTMLDivElement
  }
  window.addEventListener('message', (msg) => {
    if (msg.data.command === MessageCommand.heartbeat) {
      omegaEditPort = msg.data.data.omegaEditPort
      serverVersion = msg.data.data.serverVersion
      serverLatency = msg.data.data.serverLatency
      serverCpuLoadAvg = msg.data.data.serverCpuLoadAvg
      serverUsedMemory = msg.data.data.serverUsedMemory
      serverUptime = msg.data.data.serverUptime
      sessionCount = msg.data.data.sessionCount
    }
  })
</script>

<FlexContainer --height="25pt" --align-items="center">
  <div class="info">
    Powered by Ωedit v{serverVersion} on port {omegaEditPort}
  </div>
  <FlexContainer>
    <svg
      class="latency-indicator"
      on:mouseenter={toggleDisplay}
      on:mouseleave={toggleDisplay}
    >
      {#if serverLatency < 20}
        <circle cx="50%" cy="50%" r="4pt" fill="green" />
      {:else if serverLatency < 35}
        <circle cx="50%" cy="50%" r="4pt" fill="yellow" />
      {:else if serverLatency > 50}
        <circle cx="50%" cy="50%" r="4pt" fill="red" />
      {:else}
        <circle cx="50%" cy="50%" r="4pt" fill="grey" />
      {/if}
    </svg>
    <div class="heartbeat-text">
      <b>CPU Load Avg:</b>
      {(serverCpuLoadAvg ? serverCpuLoadAvg : 0).toFixed(2)}
      <b>Memory Usage:</b>
      {serverUsedMemory}
      <b>Session Count:</b>
      {sessionCount}
      <b>Uptime:</b>
      {(serverUptime / 1000).toFixed(0)}s
      <b>Latency:</b>
      {serverLatency}ms
    </div>
  </FlexContainer>
</FlexContainer>

<style lang="scss">
  div.info {
    min-width: fit-content;
    opacity: 0.7;
    font-style: italic;
  }
  div.heartbeat-text {
    opacity: 0;
    transition: opacity 1s ease-in-out;
  }
  svg.latency-indicator {
    height: 100%;
    width: 15pt;
  }
</style>
