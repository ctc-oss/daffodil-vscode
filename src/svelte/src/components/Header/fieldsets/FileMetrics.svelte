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
  import { saveable } from '../../../stores'
  import { createEventDispatcher } from 'svelte'
  import SidePanel from '../../layouts/SidePanel.svelte'
  const eventDispatcher = createEventDispatcher()
  let displayOpts = false

  let isSidebarOpen = false

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

  let canUndo: boolean
  let canRedo: boolean
  let canRevert: boolean
  let redoText: string
  let undoText: string
  $: {
    canUndo = $fileMetrics.changeCount > 0
    canRedo = $fileMetrics.undoCount > 0
    canRevert = $fileMetrics.undoCount + $fileMetrics.changeCount > 0
    redoText = canRedo ? '(' + $fileMetrics.undoCount + ')' : ''
    undoText = canUndo ? '(' + $fileMetrics.changeCount + ')' : ''
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
  01 Side Panel Content Here!<br />
  02 Side Panel Content Here!<br />
  03 Side Panel Content Here!<br />
  04 Side Panel Content Here!<br />
  05 Side Panel Content Here!<br />
  06 Side Panel Content Here!<br />
  07 Side Panel Content Here!<br />
  08 Side Panel Content Here!<br />
  09 Side Panel Content Here!<br />
  10 Side Panel Content Here!<br />
  11 Side Panel Content Here!<br />
  12 Side Panel Content Here!<br />
  13 Side Panel Content Here!<br />
  14 Side Panel Content Here!<br />
  15 Side Panel Content Here!<br />
  16 Side Panel Content Here!<br />
  17 Side Panel Content Here!<br />
  18 Side Panel Content Here!<br />
  19 Side Panel Content Here!<br />
  20 Side Panel Content Here!<br />
  21 Side Panel Content Here!<br />
  22 Side Panel Content Here!<br />
  23 Side Panel Content Here!<br />
  24 Side Panel Content Here!<br />
  25 Side Panel Content Here!<br />
  26 Side Panel Content Here!<br />
  27 Side Panel Content Here!<br />
  28 Side Panel Content Here!<br />
  29 Side Panel Content Here!<br />
  30 Side Panel Content Here!<br />
  31 Side Panel Content Here!<br />
  32 Side Panel Content Here!<br />
  33 Side Panel Content Here!<br />
  34 Side Panel Content Here!<br />
  35 Side Panel Content Here!<br />
  36 Side Panel Content Here!<br />
  37 Side Panel Content Here!<br />
  38 Side Panel Content Here!<br />
  39 Side Panel Content Here!<br />
  40 Side Panel Content Here!<br />
  51 Side Panel Content Here!<br />
  52 Side Panel Content Here!<br />
  53 Side Panel Content Here!<br />
  54 Side Panel Content Here!<br />
  55 Side Panel Content Here!<br />
  56 Side Panel Content Here!<br />
  57 Side Panel Content Here!<br />
  58 Side Panel Content Here!<br />
  59 Side Panel Content Here!<br />
  60 Side Panel Content Here!<br />
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
