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
  import { BYTE_VALUE_DIV_OFFSET, type ByteValue } from './BinaryData'
  import { bytesPerRow } from './BinaryData'
  import BinaryValue from './BinaryValueDiv.svelte'

  export let binaryDataStr: string

  let byteValues: string[] = []
  let binaryData: ByteValue[] = []
  let selectionActive = false
  let lineCount = 0

  $: {
    byteValues = binaryDataStr.match(/[0-9a-fA-F]{2}/g) || []
    binaryData = byteValues.map((byteStr, index) => {
      return {
        text: byteStr,
        offset: index,
        value: parseInt(byteStr, 16),
        editingActive: false,
      }
    })
  }

  let byteActionPxOffsets = {
    insertLeft: {
      left: 0,
      top: 0
    },
    insertRight: {
      left: 0,
      top: 0
    },
    delete: {
      left: 0,
      top: 0
    }
  }

  function select_byte(event: CustomEvent) { 
    const targetDiv = event.detail.targetDiv
    byteActionPxOffsets = {
      insertLeft: {
        left: targetDiv.offsetLeft - BYTE_VALUE_DIV_OFFSET,
        top: targetDiv.offsetTop
      },
      insertRight: {
        left: targetDiv.offsetLeft + BYTE_VALUE_DIV_OFFSET,
        top: targetDiv.offsetTop
      },
      delete: {
        left: targetDiv.offsetLeft,
        top: targetDiv.offsetTop + BYTE_VALUE_DIV_OFFSET
      }
    }
    selectionActive = true
    console.log(event) 
  }
</script>

<button >Refresh</button>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="byte-container" style="width: calc({$bytesPerRow} * {BYTE_VALUE_DIV_OFFSET}px);">  <div class="byte">
{#if selectionActive}
  <div class="delete" style="top: {byteActionPxOffsets.delete.top}px; left: {byteActionPxOffsets.delete.left}px;">&#10006;</div>
  <div
    class="insert-left"
    style="top: {byteActionPxOffsets.insertLeft.top}px; left: {byteActionPxOffsets.insertLeft.left}px;"
  >
    &#8676;
  </div>
  <input id="byte-input" type="text" placeholder={"00"} />
  <div
    id="insert-right"
    class="insert-right"
    style="top: {byteActionPxOffsets.insertRight.top}px; left: {byteActionPxOffsets.insertRight.left}px;"
  >
    &#8677;
  </div>
{/if}
</div>
{#key binaryDataStr}
  {#each binaryData as byte}
    <BinaryValue {byte} on:select_byte={select_byte}/>
  {/each}
{/key}
</div>

<style>
  div.byte-container {
    display: flex;
    flex-wrap: wrap;
    border-radius: 5px;
    border-width: 2px;
    border-style: solid;
    border-color: var(--color-primary-mid);
    background-color: var(--color-primary-dark);
    overflow: auto;
    /* height: 200pt; */
  }
  div.insert-left,
  div.insert-right,
  div.delete,
  input {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    font-family: monospace;
    border-radius: 5px;
    border-style: solid;
    border-width: 2px;
    height: 20px;
    width: 20px;
    text-align: center;
    border-color: var(--color-primary-dark);
    transition: all 0.25s;
  }
  div.insert-left,
  div.insert-right,
  div.delete {
    font-size: 20px;
    border-style: dashed;
    position: absolute;
    z-index: 1;
  }
  div.insert-left,
  div.insert-right {
    font-size: 20px;
    position: absolute;
    border-color: var(--color-secondary-mid);
    color: transparent;
  }
  div.insert-left:hover,
  div.insert-right:hover {
    background-color: var(--color-primary-dark);
    color: var(--color-secondary-lightest);
  }
  div.delete:hover {
    border-color: var(--color-secondary-light);
  }
  div.delete {
    background-color: crimson;
    border-color: red;
    color: white;
  }

  input {
    background-color: var(--color-primary-mid);
    color: var(--color-secondary-lightest);
  }
</style>
