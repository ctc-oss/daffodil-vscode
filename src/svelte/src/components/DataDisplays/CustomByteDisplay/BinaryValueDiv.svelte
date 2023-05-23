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
  import { BYTE_VALUE_DIV_WIDTH, type ByteValue } from './BinaryData'
  import { ByteValueArray } from './BinaryData'
  import { createEventDispatcher } from 'svelte'

  const eventDispatcher = createEventDispatcher()

  export let byte: ByteValue = {
    text: '',
    offset: 0,
    value: 0,
    editingActive: false,
  }

  let byteActionPxOffsets = {
    left: 0,
    right: 0,
    top: 0,
  }

  const update_byte_info = (event: Event): Promise<void> => {
    byte.editingActive = byte.editingActive ? false : true

    return new Promise<void>((res, rej) => {
      const click = event as PointerEvent
      const byteElement = click.target as HTMLDivElement
      byteActionPxOffsets = {
        left: byteElement.offsetLeft - BYTE_VALUE_DIV_WIDTH,
        right: byteElement.offsetLeft + BYTE_VALUE_DIV_WIDTH,
        top: byteElement.offsetTop + BYTE_VALUE_DIV_WIDTH,
      }
      ByteValueArray.push(byte)
      res()
    })
  }

  async function select_byte(event: Event) {
    update_byte_info(event).then(() => {
      document.getElementById('byte-input').focus()
    })
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if byte.editingActive}
  <div class="byte">
    <div class="delete" style="top: {byteActionPxOffsets.top}px;">&#10006;</div>
    <div
      class="insert-left"
      style="left: {byteActionPxOffsets.left}px;"
      on:click={() => {
        eventDispatcher('insert-left', byte)
      }}
    >
      &#8676;
    </div>
    <input id="byte-input" type="text" placeholder={byte.text} />
    <div
      id="insert-right"
      class="insert-right"
      style="left: {byteActionPxOffsets.right}px;"
      on:click={() => {
        eventDispatcher('insert-right', byte)
      }}
    >
      &#8677;
    </div>
  </div>
{:else}
  <div class="byte" on:click={select_byte}>
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
  div.byte:hover {
    border-color: var(--color-primary-mid);
    cursor: pointer;
  }

  input {
    background-color: var(--color-primary-mid);
    color: var(--color-secondary-lightest);
  }
</style>
