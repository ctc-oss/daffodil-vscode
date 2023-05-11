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
  import { commitErrMsg, commitable } from '../../../stores'
  import { EditByteModes } from '../../../stores/Configuration'
  import { createEventDispatcher } from 'svelte'
  import { fileMetrics } from '../../Header/fieldsets/FileMetrics'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import Button from '../../input/Buttons/Button.svelte'
  import { editMode } from '../../Editors/DataEditor'
  const EventDispatcher = createEventDispatcher()

  let canUndo: boolean = false
  let canRedo: boolean = false
  let canRevert: boolean = false
  let redoText: string = ''
  let undoText: string = ''
  $: {
    canUndo = $fileMetrics.changeCount > 0
    canRedo = $fileMetrics.undoCount > 0
    canRevert = $fileMetrics.undoCount + $fileMetrics.changeCount > 0
    redoText = canRedo ? '(' + $fileMetrics.undoCount + ')' : ''
    undoText = canUndo ? '(' + $fileMetrics.changeCount + ')' : ''
  }
  function commitChanges(event: Event) {
    EventDispatcher('commitChanges', event)
  }
  function redo() {
    EventDispatcher('redo')
  }
  function undo() {
    EventDispatcher('undo')
  }
  function clearChangeStack() {
    EventDispatcher('clearChangeStack')
  }
</script>

<fieldset class="box margin-top">
  <legend
    >Content Controls
    {#if !$commitable && $editMode === EditByteModes.Multiple}
      <span class="errMsg">{$commitErrMsg}</span>
    {/if}
  </legend>
  <FlexContainer>
    <!-- Full Mode Content Controls -->
    {#if $editMode === EditByteModes.Multiple}
      <Button disabledBy={!$commitable} fn={commitChanges}>
        <span slot="left" class="btn-icon">&#10003;</span>
        <span slot="default">Commit</span>
      </Button>
      <Button disabledBy={!canRedo} fn={redo}>
        <span slot="left" class="mirror btn-icon">&#9100;</span>
        <span slot="default">Redo{redoText}</span>
      </Button>
      <Button disabledBy={!canUndo} fn={undo}>
        <span slot="left" class="btn-icon">&#9100;</span>
        <span slot="default">Undo{undoText}</span>
      </Button>
      <Button disabledBy={!canRevert} fn={clearChangeStack}>
        <span slot="left" class="btn-icon">&#8635;</span>
        <span slot="default">Revert All</span>
      </Button>
    {:else}
      <!-- Simple Mode Content Controls -->
      <Button disabledBy={!canRedo} fn={redo}>
        <span slot="left" class="mirror btn-icon">&#9100;</span>
        <span slot="default">Redo{redoText}</span>
      </Button>
      <Button disabledBy={!canUndo} fn={undo}>
        <span slot="left" class="btn-icon">&#9100;</span>
        <span slot="default">Undo{undoText}</span>
      </Button>
      <Button disabledBy={!canRevert} fn={clearChangeStack}>
        <span slot="left" class="btn-icon">&#8635;</span>
        <span slot="default">Revert All</span>
      </Button>
    {/if}
  </FlexContainer>
</fieldset>

<style lang="scss">
</style>
