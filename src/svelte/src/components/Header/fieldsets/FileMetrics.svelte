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
  import Button from '../../Inputs/Buttons/Button.svelte'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import { fileMetrics } from './FileMetrics'
  import { MessageCommand } from '../../../utilities/message'
  import { vscode } from '../../../utilities/vscode'
  import { offsetMax, saveable } from '../../../stores'
  import { createEventDispatcher } from 'svelte'
  import SidePanel from '../../layouts/SidePanel.svelte'
  import ByteFrequencyGraph from '../../DataMetrics/ByteFrequencyGraph.svelte'
  const eventDispatcher = createEventDispatcher()

  let displayOpts = false
  let isSidebarOpen = false
  let canUndo: boolean
  let canRedo: boolean
  let canRevert: boolean
  let redoText: string
  let undoText: string
  let startOffset: number = 0
  let length: number = 0

  function saveAs() {
    vscode.postMessage({
      command: MessageCommand.saveAs,
    })
    displayOpts = false
  }

  function save() {
    vscode.postMessage({
      command: MessageCommand.save,
    })
    displayOpts = false
  }

  function toggleSaveDisplay() {
    displayOpts = !displayOpts
    if (displayOpts) {
      // set displayOpts to false after 10 seconds
      setTimeout(() => {
        displayOpts = false
      }, 10000)
    }
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.fileInfo:
        {
          if ('fileName' in msg.data.data) {
            $fileMetrics.name = msg.data.data.fileName
          }
          if ('type' in msg.data.data) {
            $fileMetrics.type = msg.data.data.type
          }
          if ('diskFileSize' in msg.data.data) {
            $fileMetrics.diskSize = msg.data.data.diskFileSize
          }
          if ('computedFileSize' in msg.data.data) {
            $fileMetrics.computedSize = msg.data.data.computedFileSize
          }
          if ('changeCount' in msg.data.data) {
            $fileMetrics.changeCount = msg.data.data.changeCount
          }
          if ('undoCount' in msg.data.data) {
            $fileMetrics.undoCount = msg.data.data.undoCount
          }
        }
        break
      default:
        break // do nothing
    }
  })

  $: {
    canUndo = $fileMetrics.changeCount > 0
    canRedo = $fileMetrics.undoCount > 0
    canRevert = $fileMetrics.undoCount + $fileMetrics.changeCount > 0
    redoText = canRedo ? '(' + $fileMetrics.undoCount + ')' : ''
    undoText = canUndo ? '(' + $fileMetrics.changeCount + ')' : ''
    length = length === 0 ? $offsetMax - startOffset : length
  }

  function redo() {
    eventDispatcher('redo')
  }

  function undo() {
    eventDispatcher('undo')
  }

  function clearChangeStack() {
    eventDispatcher('clearChangeStack')
  }

  function toggleMetrics() {
    isSidebarOpen = !isSidebarOpen
  }
</script>

<SidePanel position="top-left" title="Metrics" bind:open={isSidebarOpen}>
  {#if isSidebarOpen}
    <ByteFrequencyGraph title="Byte Frequency Profile" {startOffset} {length} />
  {/if}
</SidePanel>

<fieldset class="file-metrics">
  <legend>File Metrics</legend>
  <FlexContainer --dir="row">
    <span id="file_name" class="nowrap">{$fileMetrics.name}</span>&nbsp;
  </FlexContainer>
  <FlexContainer --dir="row" --align-items="center">
    {#if displayOpts}
      <Button fn={save} disabledBy={!$saveable}>
        <span slot="left" class="btn-icon">&#x1F4BE;</span>
        <span slot="default">&nbsp;Save</span>
      </Button>
      <Button fn={saveAs}>
        <span slot="left" class="btn-icon">&#x1F4C1;</span>
        <span slot="default">&nbsp;Save As</span>
      </Button>
    {:else}
      <Button fn={toggleSaveDisplay}>
        <span slot="left" class="btn-icon">&#10515;</span>
        <span slot="default">Save ...</span>
      </Button>
    {/if}
  </FlexContainer>
  <hr />
  <FlexContainer --dir="row">
    <FlexContainer --dir="column">
      <label for="disk_file_size">Disk Size</label>
      <span id="disk_file_size" class="nowrap">{$fileMetrics.diskSize}</span>
    </FlexContainer>
    <FlexContainer --dir="column">
      <label for="computed_file_size">Computed Size</label>
      <span id="computed_file_size" class="nowrap"
        >{$fileMetrics.computedSize}</span
      >
    </FlexContainer>
    <FlexContainer --dir="column">
      <label for="content_type">Content Type</label>
      <span id="content_type" class="nowrap">{$fileMetrics.type}</span>
    </FlexContainer>
  </FlexContainer>
  <hr />
  <FlexContainer>
    <FlexContainer --dir="column" --align-items="center">
      <FlexContainer --dir="row">
        <Button disabledBy={!canRedo} fn={redo}>
          <span slot="left" class="mirror btn-icon">&#9100;</span>
          <span slot="default">&nbsp;Redo{redoText}</span>
        </Button>
        <Button disabledBy={!canUndo} fn={undo}>
          <span slot="left" class="btn-icon">&#9100;</span>
          <span slot="default">&nbsp;Undo{undoText}</span>
        </Button>
        <Button disabledBy={!canRevert} fn={clearChangeStack}>
          <span slot="left" class="btn-icon">&#8635;</span>
          <span slot="default">&nbsp;Revert All</span>
        </Button>
      </FlexContainer>
    </FlexContainer>
    <FlexContainer --dir="column" --align-items="center">
      <Button fn={toggleMetrics}>
        <span slot="left" class="btn-icon">&#x2211;</span>
        <span slot="default">Metrics</span>
      </Button>
    </FlexContainer>
  </FlexContainer>
</fieldset>

<style lang="scss">
  fieldset {
    width: 100%;
    min-width: 180pt;
  }
  fieldset label {
    font-weight: bold;
  }
  span.nowrap {
    white-space: nowrap;
    overflow-x: auto;
    display: inline-block;
  }
</style>
