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
    addressRadix,
    allowCaseInsensitiveSearch,
    editorEncoding,
    searchCaseInsensitive,
    seekOffsetInput,
    seekable,
  } from '../../../stores'
  import { replaceErr, searchErr, searchable, replaceable, seekErr } from '..'
  import { searchQuery, replaceQuery } from './SearchReplace'
  import { vscode } from '../../../utilities/vscode'
  import { MessageCommand } from '../../../utilities/message'

  import Error from '../../Error/Error.svelte'
  import Button from '../../Inputs/Buttons/Button.svelte'
  import Input from '../../Inputs/Input/Input.svelte'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import { createEventDispatcher } from 'svelte'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'

  const eventDispatcher = createEventDispatcher()

  let searchErrDisplay: boolean
  let replaceErrDisplay: boolean
  let caseInsensitiveToggled: boolean = false
  let containerClass: string
  let inlineClass: string
  let inputClass: string

  $: {
    containerClass = CSSThemeClass('input-actions')
    inlineClass = CSSThemeClass('inline-container')
    inputClass = CSSThemeClass('actionable')
  }
  $: searchErrDisplay = $searchErr.length > 0 && !$searchable
  $: replaceErrDisplay = $replaceErr.length > 0 && !$replaceable
  $: $seekErr = $seekable.seekErrMsg

  function case_sensitive_action(_: MouseEvent) {
    $searchCaseInsensitive = !$searchCaseInsensitive
    caseInsensitiveToggled = !caseInsensitiveToggled
  }
  function search() {
    searchQuery.clear()
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
    searchQuery.clear()
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
    eventDispatcher('clearDataDisplays')
  }
  function handleInputEnter(event: CustomEvent) {
    switch (event.detail.id) {
      case 'search':
        search()
        break
      case 'replace':
        searchAndReplace()
        break
      case 'seek':
        eventDispatcher('seek')
        break
    }
  }
  function CSSThemeClass(selectors?: string) {
    return selectors + ' ' + $UIThemeCSSClass
  }
  function scrollSearchNext() {
    searchQuery.updateSearchResults(++$searchQuery.searchIndex)
    eventDispatcher('seek')
  }
  function scrollSearchPrev() {
    searchQuery.updateSearchResults(--$searchQuery.searchIndex)
    eventDispatcher('seek')
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.searchResults:
        $searchQuery.searchResults = msg.data.data.results
        $searchQuery.processing = false
        if ($searchQuery.searchResults.length > 0) {
          searchQuery.updateSearchResults($searchQuery.searchIndex)
          eventDispatcher('seek')
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
    <FlexContainer --dir="row">
      <Input
        id="seek"
        placeholder="Seek To Offset (base {$addressRadix})"
        bind:value={$seekOffsetInput}
        on:inputEnter={handleInputEnter}
      />
      <Error
        err={seekErr}
        display={$seekOffsetInput.length > 0 && !$seekable.valid}
      />
      <Button
        disabledBy={!$seekable.valid}
        fn={() => {
          eventDispatcher('seek')
        }}
      >
        <span slot="left" class="btn-icon material-symbols-outlined">start</span
        >
        <span slot="default">&nbsp;Seek</span>
      </Button>
    </FlexContainer>
    <FlexContainer --dir="row" --align-items="center">
      {#if $allowCaseInsensitiveSearch}
        <span class={containerClass}>
          <span class={inlineClass}>
            <input
              id="search"
              type="search"
              class={inputClass}
              placeholder="Search"
              bind:value={$searchQuery.input}
            />
            <button
              class="{$UIThemeCSSClass} case-btn"
              on:click={case_sensitive_action}
              class:active={$searchCaseInsensitive}
              title="Toggle Case Sensitive Search"><u>Aa</u></button
            >
          </span>
        </span>
      {:else}
        <Input
          id="search"
          placeholder="Search"
          bind:value={$searchQuery.input}
          on:inputEnter={handleInputEnter}
        />
      {/if}
      <Error err={searchErr} display={searchErrDisplay} />
      <Button disabledBy={!$searchable} fn={search}>
        <span slot="left" class="btn-icon material-symbols-outlined"
          >search</span
        >
        <span slot="default">&nbsp;Search</span></Button
      >
    </FlexContainer>

    <FlexContainer --dir="row" --align-items="center">
      <Input
        id="replace"
        placeholder="Replace"
        bind:value={$replaceQuery.input}
        allowDefaultInput="true"
        on:inputEnter={handleInputEnter}
      />
      <Error err={replaceErr} display={replaceErrDisplay} />
      <Button disabledBy={!$replaceable} fn={searchAndReplace}>
        <span slot="left" class="btn-icon material-symbols-outlined"
          >find_replace</span
        >
        <span slot="default">&nbsp;Replace</span>
      </Button>
    </FlexContainer>

    {#if $searchQuery.searchResults.length > 0}
      <FlexContainer --dir="row">
        <Button fn={scrollSearchPrev}>
          <span slot="left" class="btn-icon material-symbols-outlined"
            >navigate_before</span
          >
          <span slot="default">&nbsp;Prev</span></Button
        >
        <Button fn={scrollSearchNext}>
          <span slot="default">Next&nbsp;</span>
          <span slot="right" class="btn-icon material-symbols-outlined"
            >navigate_next</span
          ></Button
        >
        <sub
          >{$searchQuery.searchIndex + 1} / {$searchQuery.searchResults.length} Results</sub
        >
      </FlexContainer>
    {/if}
    {#if $replaceQuery.count > -1}
      <FlexContainer --dir="row">
        <sub
          >{$replaceQuery.count} Replacement{$replaceQuery.count === 1
            ? ''
            : 's'}</sub
        >
      </FlexContainer>
    {/if}
  </FlexContainer>
</fieldset>

<style lang="scss">
  fieldset {
    width: 100%;
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
    cursor: pointer;
  }
</style>
