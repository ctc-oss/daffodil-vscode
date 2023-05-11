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
  import { editorSelection } from '../../stores'
  import { EditByteModes } from '../../stores/Configuration'
  import { UIThemeCSSClass } from '../../utilities/colorScheme'
  import { createEventDispatcher } from 'svelte'
  import ContentControls from '../DataDisplays/Fieldsets/ContentControls.svelte'
  import FlexContainer from '../layouts/FlexContainer.svelte'
  import DataView from '../DataDisplays/Fieldsets/DataView.svelte'
  import { editMode } from './DataEditor'
  const EventDispatcher = createEventDispatcher()

  function handleEditorEvent(event: Event) {
    EventDispatcher('handleEditorEvent', event)
  }
</script>

<div class="editView" id="edit_view">
  {#if $editMode === EditByteModes.Multiple}
    <textarea
      class={$UIThemeCSSClass}
      id="selectedContent"
      contenteditable="true"
      bind:value={$editorSelection}
      on:keyup|nonpassive={handleEditorEvent}
      on:click={handleEditorEvent}
      on:input={handleEditorEvent}
    />
  {:else}
    <textarea class={$UIThemeCSSClass} id="selectedContent" disabled />
  {/if}

  <FlexContainer>
    <ContentControls on:clearChangeStack on:commitChanges on:redo on:undo />
  </FlexContainer>

  <FlexContainer>
    <DataView />
  </FlexContainer>
</div>
