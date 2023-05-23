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
  import type { ByteValue } from './BinaryData'
  import { ByteValueArray } from './BinaryData'

  // export let byteValue: string;
  export let byte: ByteValue = { text: '', offset: 0, value: 0 }
  const byteValueContentWidth = 20
  let byteValueInterfaceWidth = 20
  let byteValueEditing = false

  let byteActionPxOffsets = {
    left: 0,
    right: 0,
    top: 0,
  }


  const update_byte_info = (event: Event): Promise<void> => {
    byteValueEditing = byteValueEditing ? false : true

    return new Promise<void>((res, rej) => {
      const click = event as PointerEvent
      const byteElement = click.target as HTMLDivElement
      byteActionPxOffsets = {
        left: byteElement.offsetLeft - 24,
        right: byteElement.offsetLeft + 24,
        top: byteElement.offsetTop + 24,
      }
      ByteValueArray.push(byte)
      res()
    })
    
  }

  async function set_editing(event: Event) {
    update_byte_info(event).then(()=>{
      document.getElementById('byte-input').focus()
    })

  }
  function set_focus(event: Event) {
  }
  function update_byte(event: Event) {
    console.log(byte)
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if byteValueEditing}
  <div class="byte">
    <div class="delete" style="top: {byteActionPxOffsets.top}px;">&#10006;</div>
    <div class="insert-left" style="left: {byteActionPxOffsets.left}px;">
      &#8676;
    </div>
    <input
      id="byte-input"
      type="text"
      on:keypress={update_byte}
      placeholder={byte.text}
      on:load={set_focus}
    />
    <div
      id="insert-right"
      class="insert-right"
      style="left: {byteActionPxOffsets.right}px;"
    >
      &#8677;
    </div>
  </div>
{:else}
  <div class="byte" on:click={set_editing}>
    {byte.text}
  </div>
{/if}

<style>
  div.byte,
  div.insert-left,
  div.insert-right,
  div.delete,
  input {
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
    background-color: var(--color-primary-dark);
    border-color: var(--color-secondary-mid);
  }
  div.insert-left:hover,
  div.insert-right:hover,
  div.delete:hover {
    border-color: var(--color-secondary-light);
  }
  div.delete {
    background-color: crimson;
    border-color: red;
    color: white;
  }
  div.byte:hover {
    border-color: var(--color-primary-mid);
    cursor: pointer;
  }

  input {
    background-color: var(--color-primary-mid);
    color: var(--color-secondary-lightest);
  }
</style>
