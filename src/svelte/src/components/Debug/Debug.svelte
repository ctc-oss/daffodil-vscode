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
  import { currentViewport } from 'stores/states.svelte.ts'
  import {
    type DebugVariable,
    getDebugVarContext,
    setDebugVarContext,
  } from './Debug.svelte.ts'
  import DebugOutput from './DebugOutput.svelte'

  let { children } = $props()
  let displayDebug = $state(false)

  let { get, remove } = setDebugVarContext()
  let testState = $state(new Uint8Array(64).fill(0xff))

  $effect(() => {
    console.log('state changed', $state.snapshot(currentViewport()))
  })
  const tint = setInterval(() => {
    testState.fill(testState[0] - 1)
    if (testState[0] === 0x0f) clearTimeout(tint)
  }, 1500)
</script>

{@render children()}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="dbg-show {displayDebug ? 'show' : 'hidden'}"
  onclick={() => (displayDebug = displayDebug ? false : true)}
>
  <span
    class="dbg-btn {displayDebug ? 'show' : 'hidden'} material-symbols-outlined"
    >pest_control</span
  >
</div>
{#snippet printVar(dvar: DebugVariable)}
  <div class="debug-var">
    <span class="id">{dvar.id}:</span>
    <span class="value">{dvar.valueStr()}</span>
  </div>
{/snippet}
{#if displayDebug}
  <div id="debug-container">
    {#each get() as dvar}
      <DebugOutput
        {...dvar}
        renderVar={printVar}
        removeVar={() => {
          remove(dvar)
        }}
      />
    {/each}
  </div>
{/if}

<style lang="scss">
  div.dbg-show {
    height: 40px;
    font-size: 40px;
    width: 40px;
    line-height: 1;
    border-radius: 5px;
    border: 2px grey solid;
    justify-content: center;
    align-content: center;
    display: flex;
  }
  div.dbg-show.hidden {
    background-color: var(--vscode-editor-background);
  }
  div.dbg-show.show {
    background-color: grey;
  }
  div.dbg-show .dbg-btn {
    cursor: pointer;
  }
  div#debug-container {
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-content: space-between;
  }
  div#debug-container .debug-var {
    display: flex;
    width: 100%;
    justify-content: space-between;
  }

  div#debug-container .debug-var .id {
    overflow: hidden;
  }
  div#debug-container .debug-var .value {
    width: 50%;
  }
</style>
