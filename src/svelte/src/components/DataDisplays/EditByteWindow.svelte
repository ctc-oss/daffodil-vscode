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
  import { createEventDispatcher } from 'svelte'
  import {
    addressValue,
    commitable,
    editedByteIsOriginalByte,
    focusedViewportId,
    selectionStartOffset,
    editorSelection,
    commitErrMsg,
    editByte,
    bytesPerRow,
  } from '../../stores'
  import {
    edit_byte_window_ref,
    radixToString,
    viewport_references,
    type ViewportReferences,
  } from '../../utilities/display'
  import { UIThemeCSSClass } from '../../utilities/colorScheme'
  import FlexContainer from '../layouts/FlexContainer.svelte'

  const EventDispatcher = createEventDispatcher()

  export let disabled: boolean = false
  let containerClass: string
  let inlineClass: string
  let inputClass: string

  $: $editorSelection = $editByte
  $: {
    containerClass = CSSThemeClass('input-actions')
    inlineClass = CSSThemeClass('inline-container')
    inputClass = CSSThemeClass('actionable')
  }

  function moveEditByteWindow() {
    let viewportRefs = viewport_references() as ViewportReferences
    let editByteWindow = edit_byte_window_ref()
    switch ($focusedViewportId) {
      case 'physical':
        {
          const byteTextPxWidth =
            viewportRefs.logical.clientWidth / $bytesPerRow
          const byteRowPos = $selectionStartOffset % $bytesPerRow
          const editByteWindowX =
            viewportRefs.logical.offsetLeft + byteRowPos * byteTextPxWidth
          editByteWindow.style.left = editByteWindowX.toString() + 'px'
          $focusedViewportId = 'logical'
        }
        break
      case 'logical':
        {
          const byteTextPxWidth =
            viewportRefs.physical.clientWidth / $bytesPerRow
          const byteRowPos = $selectionStartOffset % $bytesPerRow
          const editByteWindowX =
            viewportRefs.physical.offsetLeft + byteRowPos * byteTextPxWidth
          editByteWindow.style.left = editByteWindowX.toString() + 'px'
          $focusedViewportId = 'physical'
        }
        break
    }
    document.getElementById('editByteInput').focus()
  }
  function CSSThemeClass(selectors?: string) {
    return selectors + ' ' + $UIThemeCSSClass
  }
  function commitChanges(event: Event) {
    if (disabled) return
    EventDispatcher('commitChanges', event)
  }
  function handleEditorEvent() {
    if (disabled) return
    EventDispatcher('handleEditorEvent')
  }
</script>

<FlexContainer>
  <div class="edit-byte-window ephemeral" id="editByteWindow">
    <FlexContainer --dir="row">
      <span class={containerClass}>
        <span class={inlineClass}>
          {#if $focusedViewportId === 'physical'}
            <button
              class={inputClass + ' flex-container row col-item'}
              title="Show in Logical View"
              on:click={moveEditByteWindow}>&#8649;</button
            >
          {:else}
            <button
              class={inputClass + ' flex-container row col-item'}
              title="Show in Physical View"
              on:click={moveEditByteWindow}>&#8647;</button
            >
          {/if}
          <input
            title="byte position {$selectionStartOffset.toString(
              $addressValue
            )} {radixToString($addressValue)}"
            type="text"
            id="editByteInput"
            class={inputClass}
            bind:value={$editorSelection}
            on:input={handleEditorEvent}
            {disabled}
          />
        </span>
      </span>
      {#if $commitable}
        <button
          title="insert byte before this location"
          id="insert-before"
          class="insert"
          on:click={commitChanges}>&#8676;</button
        >
        <button
          title="replace byte at this location"
          id="insert-replace"
          class="submit"
          on:click={commitChanges}>&#8645;</button
        >
        <button
          title="insert byte after this location"
          id="insert-after"
          class="insert"
          on:click={commitChanges}>&#8677;</button
        >
        <button
          title="delete this byte"
          id="insert-delete"
          class="delete"
          on:click={commitChanges}>✖</button
        >
      {:else if $editedByteIsOriginalByte}
        <button
          title="insert byte before this location"
          id="insert-before"
          class="insert"
          on:click={commitChanges}>&#8676;</button
        >
        <button class="submit" disabled>&#8645;</button>
        <button
          title="insert byte after this location"
          id="insert-after"
          class="insert"
          on:click={commitChanges}>&#8677;</button
        >
        <button
          title="delete this byte"
          id="insert-delete"
          class="delete"
          on:click={commitChanges}>✖</button
        >
      {:else}
        <button
          title="delete this byte"
          id="insert-delete"
          class="delete"
          on:click={commitChanges}>✖</button
        >
        <button class="insert" disabled>&#8676;</button>
        <button class="submit" disabled>&#8645;</button>
        <button class="insert" disabled>&#8677;</button>
      {/if}
    </FlexContainer>
    {#if !$commitable && $commitErrMsg.length > 0}
      <div class="err">
        <span class="errMsg">{$commitErrMsg}</span>
      </div>
    {/if}
  </div>
</FlexContainer>

<style lang="scss">
  span.input-actions {
    padding: 0px;
    width: 50%;
  }
  span.input-actions input:focus {
    outline: 0;
  }
  span.input-actions.dark {
    background-color: #322716;
  }
  span.input-actions.light {
    background-color: #fffdfa;
  }
  span.errMsg {
    color: red;
  }
  div.err {
    background-color: black;
    opacity: 0.85;
    border-radius: 5px;
    margin: 4px;
    padding: 4px;
  }
  div.edit-byte-window {
    width: 95pt;
    height: 20pt;
    position: absolute;
    z-index: 1;
  }

  div.edit-byte-window input {
    width: 20%;
    border-width: 1px;
    text-align: center;
    font-size: medium;
    line-height: 1.1;
  }

  div.edit-byte-window input.dark {
    background-color: #322716;
  }

  div.edit-byte-window input.light {
    background-color: #fffdfa;
  }

  div.edit-byte-window button {
    padding: 0;
    margin: 0;
    width: 20pt;
  }

  div.edit-byte-window button.switch-viewport {
    padding: 1pt;
    background-color: lightyellow;
    color: darkslategrey;
  }

  div.edit-byte-window button:disabled {
    opacity: 0.6;
  }

  button.submit {
    background: green;
    color: #e1e3e5;
    font-size: large;
  }

  button.delete {
    background: red;
    color: #e1e3e5;
    font-size: large;
    line-height: 0;
  }

  button.insert {
    background: darkorchid;
    color: #e1e3e5;
    font-size: large;
  }
  button.actionable {
    max-width: 10pt;
    width: auto;
    padding: 0px;
    opacity: 0.7;
    line-height: 1;
    font-size: large;
  }
  button.actionable:hover {
    opacity: 1;
  }
  button.actionable.dark {
    background-color: #322716;
  }
  button.actionable.light {
    background-color: #fffdfa;
  }
  button:disabled {
    opacity: 0.6;
  }
</style>
