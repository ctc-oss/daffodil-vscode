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

  let displayOpts = false

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
</script>

<fieldset class="file-metrics">
  <legend>File Metrics</legend>
  <FlexContainer --dir="column">
    <label for="file_name">Path</label>
    <span id="file_name" class="nowrap">{$fileMetrics.name}</span>
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
    {#if displayOpts}
      <Button fn={save}>
        <span slot="left" class="btn-icon">&#8615;</span>
        <span slot="default">Save</span>
      </Button>
      <Button fn={saveAs}>
        <span slot="left" class="btn-icon">&#8615;</span>
        <span slot="default">Save As</span>
      </Button>
    {:else}
      <Button fn={toggleSaveDisplay}>
        <span slot="default">Save ...</span>
      </Button>
    {/if}
  </FlexContainer>
</fieldset>

<style lang="scss">
  fieldset {
    width: 100%;
    min-width: 175pt;
  }
  fieldset label {
    font-weight: 700;
  }
  span.nowrap {
    white-space: nowrap;
    overflow-x: auto;
    display: inline-block;
  }
</style>
