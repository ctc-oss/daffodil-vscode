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
  import { type ByteValue, ByteValueWidths } from './BinaryData'

  // export let byteValue: string;
  export let byte: ByteValue = { text: '', offset: 0, value: 0 }
  const byteValueContentWidth = 20
  let byteValueInterfaceWidth = 20
  let byteValueEditing = false

  const setEditing = () => {
    byteValueEditing = byteValueEditing ? false : true
    byteValueInterfaceWidth = byteValueEditing
      ? ByteValueWidths.EDITING
      : ByteValueWidths.DISPLAY
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if byteValueEditing}
  <div class="insertions" style="width: {byteValueContentWidth}px;">
    &#8676;
  </div>
  <div on:click={setEditing} style="width: {byteValueContentWidth}px;">
    {byte.text}
  </div>
  <div class="insertions" style="width: {byteValueContentWidth}px;">
    &#8677;
  </div>
{:else}
  <div on:click={setEditing} style="width: {byteValueContentWidth}px;">
    {byte.text}
  </div>
{/if}

<style>
  div {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    font-family: monospace;
    border-radius: 5px;
    border-style: solid;
    border-width: 2px;
    height: 20px;
    text-align: center;
    border-color: var(--color-primary-dark);
    transition: all 0.25s;
  }
  div.insertions {
    font-size: 20px;
  }
  div:hover {
    border-color: var(--color-primary-mid);
    cursor: pointer;
  }
</style>
