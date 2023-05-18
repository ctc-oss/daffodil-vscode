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
  import {
    allowCaseInsensitiveSearch,
    editorEncoding,
    searchCaseInsensitive,
  } from '../../../stores'
  import { replaceErr, searchErr, searchable, replaceable } from '..'
  import { searchQuery, replaceQuery } from './SearchReplace'
  import { vscode } from '../../../utilities/vscode'
  import { MessageCommand } from '../../../utilities/message'

  import Error from '../../Error/Error.svelte'
  import Button from '../../Inputs/Buttons/Button.svelte'
  import Input from '../../Inputs/Input/Input.svelte'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import { createEventDispatcher } from 'svelte'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'

  const EventDispatcher = createEventDispatcher()

  let searchErrDisplay = false
  let replaceErrDisplay = false
  let containerClass: string
  let inlineClass: string
  let inputClass: string
  let caseInsensitiveToggled: boolean = false

  $: {
    containerClass = CSSThemeClass('input-actions')
    inlineClass = CSSThemeClass('inline-container')
    inputClass = CSSThemeClass('actionable')
  }
  $: searchErrDisplay = $searchErr.length > 0 && !$searchable
  $: replaceErrDisplay = $replaceErr.length > 0 && !$replaceable

  function case_sensitive_action(_: MouseEvent) {
    $searchCaseInsensitive = !$searchCaseInsensitive
    caseInsensitiveToggled = !caseInsensitiveToggled
  }
  function search() {
    searchQuery.clear_results()
    $replaceQuery.count = -1
    vscode.postMessage({
      command: MessageCommand.search,
      data: {
        searchData: $searchQuery.input,
        caseInsensitive: $searchCaseInsensitive,
        encoding: $editorEncoding,
      },
    })
    $searchQuery.processing = true
  }
  function searchAndReplace() {
    searchQuery.clear_results()
    $replaceQuery.count = -1
    vscode.postMessage({
      command: MessageCommand.searchAndReplace,
      data: {
        searchData: $searchQuery.input,
        caseInsensitive: $searchCaseInsensitive,
        replaceData: $replaceQuery.input,
        encoding: $editorEncoding,
      },
    })
    $replaceQuery.processing = true
    EventDispatcher('clearDataDisplays')
  }
  function CSSThemeClass(selectors?: string) {
    return selectors + ' ' + $UIThemeCSSClass
  }
  function scrollSearchNext() {
    searchQuery.update_search_results(++$searchQuery.searchIndex)
    EventDispatcher('goTo')
  }
  function scrollSearchPrev() {
    searchQuery.update_search_results(--$searchQuery.searchIndex)
    EventDispatcher('goTo')
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.searchResults:
        $searchQuery.searchResults = msg.data.data.results
        $searchQuery.processing = false
        if ($searchQuery.searchResults.length > 0) {
          searchQuery.update_search_results($searchQuery.searchIndex)
          EventDispatcher('goTo')
        }
        break

      case MessageCommand.replaceResults:
        $replaceQuery.processing = false
        $replaceQuery.count = msg.data.data.replacementsCount
        // reset replace query count after 5 seconds
        setTimeout(() => {
          $replaceQuery.count = -1
        }, 5000)
        break
    }
  })
</script>

<fieldset class="search-replace">
  <legend>Search</legend>
  <FlexContainer --dir="column" --align-items="center">
    <FlexContainer --dir="row" --align-items="center" --height="25pt">
      <label for="search">Search:</label>

      {#if $allowCaseInsensitiveSearch}
        <span class={containerClass}>
          <span class={inlineClass}>
            <input
              id="search"
              class={inputClass}
              bind:value={$searchQuery.input}
            />
            <button
              class={$UIThemeCSSClass + ' case-btn'}
              on:click={case_sensitive_action}
              class:active={caseInsensitiveToggled}
              title="Toggle Case Sensitive Search"><u>aA</u></button
            >
          </span>
        </span>
      {:else}
        <Input id="search" bind:value={$searchQuery.input} --width="75%" />
      {/if}

      <Error err={searchErr} display={searchErrDisplay} />
    </FlexContainer>

    <FlexContainer --dir="row" --align-items="center" --height="25pt">
      <label for="replace">Replace:</label>
      <Input id="replace" bind:value={$replaceQuery.input} --width="75%" />
      <Error err={replaceErr} display={replaceErrDisplay} />
    </FlexContainer>

    <FlexContainer --dir="row">
      <Button disabledBy={!$searchable} fn={search}>
        <span slot="left" class="btn-icon rotate">&#9906;</span>
        <span slot="default">Search</span></Button
      >
      <Button disabledBy={!$replaceable} fn={searchAndReplace}>
        <span slot="left" class="btn-icon">&#8645;</span>
        <span slot="default">Replace</span>
      </Button>
    </FlexContainer>

    {#if $searchQuery.searchResults.length > 0}
      <FlexContainer --dir="row">
        <Button fn={scrollSearchPrev}>
          <span slot="left" class="btn-icon">&#x23F4;</span>
          <span slot="default">Prev</span></Button
        >
        <Button fn={scrollSearchNext}>
          <span slot="default">Next</span>
          <span slot="right" class="btn-icon">&#x23F5;</span></Button
        >
        <sub
          >{$searchQuery.searchIndex + 1} / {$searchQuery.searchResults.length} Results</sub
        >
      </FlexContainer>
    {/if}
    {#if $replaceQuery.count > -1}
      <FlexContainer --dir="row">
        <sub>{$replaceQuery.count} Replacements</sub>
      </FlexContainer>
    {/if}
  </FlexContainer>
</fieldset>

<style lang="scss">
  fieldset {
    width: 100%;
  }
  fieldset label {
    width: 80pt;
  }
  fieldset input {
    width: 75%;
  }
  fieldset .checkbox {
    width: auto;
  }
  .rotate {
    display: inline-block;
    transform: rotate(-45deg);
  }
  button.case-btn {
    margin-right: 5px;
  }
</style>
