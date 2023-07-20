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
    editorActionsAllowed,
    editorEncoding,
    searchCaseInsensitive,
    seekOffsetInput,
    seekable,
  } from '../../../stores'
  import {
    seekErr,
    searchErr,
    replaceErr,
    searchable,
    replaceable,
    searchQuery,
    replaceQuery,
  } from './SearchReplace'
  import { vscode } from '../../../utilities/vscode'
  import { MessageCommand, ReplaceStrategy } from '../../../utilities/message'

  import Error from '../../Error/Error.svelte'
  import Button from '../../Inputs/Buttons/Button.svelte'
  import Input from '../../Inputs/Input/Input.svelte'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import { createEventDispatcher } from 'svelte'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
  import ToggleableButton from '../../Inputs/Buttons/ToggleableButton.svelte'

  const eventDispatcher = createEventDispatcher()

  let searchErrDisplay: boolean
  let replaceErrDisplay: boolean
  let caseInsensitiveToggled: boolean = false
  let containerClass: string
  let inlineClass: string
  let inputClass: string
  let startOffset: number = 0
  let replaceStarted: boolean = false
  let showReplaceOptions: boolean = false

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
    showReplaceOptions = false
    $replaceQuery.count = -1
    $replaceQuery.replaceOneCount = 0
    $replaceQuery.skipCount = 0
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

  function startReplace() {
    searchQuery.clear()
    startOffset = 0
    replaceStarted = true
    search()
  }

  function skipReplace() {
    vscode.postMessage({
      command: MessageCommand.searchAndReplace,
      data: {
        searchData: $searchQuery.input,
        caseInsensitive: $searchCaseInsensitive,
        replaceData: $replaceQuery.input,
        encoding: $editorEncoding,
        startOffset: startOffset + 1,
        replaceStrategy: ReplaceStrategy.searchNext,
      },
    })
  }

  function searchAndReplace(
    strategy: ReplaceStrategy = ReplaceStrategy.ReplaceOne
  ) {
    searchQuery.clear()
    $replaceQuery.count = -1
    $replaceQuery.replaceOneCount = 0
    $replaceQuery.skipCount = 0
    vscode.postMessage({
      command: MessageCommand.searchAndReplace,
      data: {
        searchData: $searchQuery.input,
        caseInsensitive: $searchCaseInsensitive,
        replaceData: $replaceQuery.input,
        encoding: $editorEncoding,
        overwriteOnly: $editorActionsAllowed === 'overwrite-only',
        startOffset: startOffset,
        replaceStrategy: strategy,
      },
    })
    $replaceQuery.processing = true
    eventDispatcher('clearDataDisplays')
  }

  function replaceOne() {
    searchAndReplace(ReplaceStrategy.ReplaceOne)
  }

  function replaceRest() {
    searchAndReplace(ReplaceStrategy.ReplaceAll)
  }

  function replaceAll() {
    startOffset = 0
    searchAndReplace(ReplaceStrategy.ReplaceAll)
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

  function scrollSearchFirst() {
    $searchQuery.searchIndex = 0
    searchQuery.updateSearchResults($searchQuery.searchIndex)
    eventDispatcher('seek')
  }
  function scrollSearchNext() {
    searchQuery.updateSearchResults(++$searchQuery.searchIndex)
    eventDispatcher('seek')
  }
  function scrollSearchPrev() {
    searchQuery.updateSearchResults(--$searchQuery.searchIndex)
    eventDispatcher('seek')
  }
  function scrollSearchLast() {
    searchQuery.updateSearchResults($searchQuery.searchResults.length - 1)
    eventDispatcher('seek')
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.searchResults:
        $searchQuery.searchResults = msg.data.data.searchResults
        $searchQuery.processing = false
        if ($searchQuery.searchResults.length > 0) {
          searchQuery.updateSearchResults($searchQuery.searchIndex)
          eventDispatcher('seek')
        }
        if (replaceStarted) {
          replaceStarted = false
          if ($searchQuery.searchResults.length > 0) {
            showReplaceOptions = true
            startOffset = $searchQuery.searchResults[0]
          }
        }
        break

      case MessageCommand.replaceResults:
        $searchQuery.processing = false
        $replaceQuery.processing = false
        switch (msg.data.data.replaceStrategy) {
          case ReplaceStrategy.searchNext:
            ++$replaceQuery.skipCount
            $searchQuery.searchResults = msg.data.data.searchResults
            if ($searchQuery.searchResults.length > 0) {
              startOffset = $searchQuery.searchResults[0]
              searchQuery.updateSearchResults($searchQuery.searchIndex)
              eventDispatcher('seek')
            } else {
              showReplaceOptions = false
            }
            break

          case ReplaceStrategy.ReplaceOne:
            $searchQuery.searchResults = msg.data.data.searchResults
            $replaceQuery.count = msg.data.data.replacementsCount
            $replaceQuery.replaceOneCount += msg.data.data.replacementsCount
            if ($searchQuery.searchResults.length > 0) {
              startOffset = msg.data.data.replacementOffset
              searchQuery.updateSearchResults($searchQuery.searchIndex)
              eventDispatcher('seek')
            } else {
              showReplaceOptions = false
            }
            // reset replace query count after 5 seconds
            setTimeout(() => {
              $replaceQuery.count = -1
            }, 5000)
            break

          case ReplaceStrategy.ReplaceAll:
            showReplaceOptions = false
            $searchQuery.searchResults = []
            $replaceQuery.count = msg.data.data.replacementsCount
            // reset replace query count after 5 seconds
            setTimeout(() => {
              $replaceQuery.count = -1
            }, 5000)
            break
        }
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
        allowDefaultInput="true"
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
        <Input
          id="search"
          placeholder="Search"
          bind:value={$searchQuery.input}
          on:inputEnter={handleInputEnter}
        >
          <ToggleableButton
            --width="24px"
            fn={case_sensitive_action}
            active={$searchCaseInsensitive}
          >
            Aa
          </ToggleableButton>
        </Input>
        <!-- <span class={containerClass}>
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
        </span> -->
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
      <Button disabledBy={!$replaceable} fn={startReplace}>
        <span slot="left" class="btn-icon material-symbols-outlined"
          >find_replace</span
        >
        <span slot="default">&nbsp;Replace&hellip;</span>
      </Button>
    </FlexContainer>

    {#if !showReplaceOptions && $searchQuery.searchResults.length > 0}
      <FlexContainer --dir="row">
        <Button fn={scrollSearchFirst}>
          <span slot="left" class="btn-icon material-symbols-outlined"
            >first_page</span
          >
          <span slot="default">&nbsp;First</span></Button
        >
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
        <Button fn={scrollSearchLast}>
          <span slot="default">Last&nbsp;</span>
          <span slot="right" class="btn-icon material-symbols-outlined"
            >last_page</span
          ></Button
        >
      </FlexContainer>
      <FlexContainer --dir="row">
        <sub
          >{$searchQuery.searchIndex + 1} / {$searchQuery.searchResults.length} Results</sub
        >
      </FlexContainer>
    {/if}
    {#if showReplaceOptions}
      <FlexContainer --dir="row">
        <Button fn={replaceOne}>
          <span slot="left" class="icon-container">
            <span class="btn-icon material-symbols-outlined">find_replace</span>
            <div class="icon-badge">1</div>
          </span>
          <span slot="default">&nbsp;One</span></Button
        >
        <Button fn={replaceAll}>
          <span slot="left" class="icon-container">
            <span class="btn-icon material-symbols-outlined">find_replace</span>
            <div class="icon-badge">
              {$searchQuery.searchResults.length + $replaceQuery.skipCount}
            </div>
          </span>
          <span slot="default">&nbsp;All</span></Button
        >
        <Button fn={replaceRest}>
          <span slot="left" class="icon-container">
            <span class="btn-icon material-symbols-outlined">find_replace</span>
            <div class="icon-badge">{$searchQuery.searchResults.length}</div>
          </span>
          <span slot="default">&nbsp;Rest</span></Button
        >
        <Button
          fn={skipReplace}
          disabledBy={$searchQuery.searchResults.length <= 1}
        >
          <span slot="default">Next&nbsp;</span>
          <span slot="right" class="btn-icon material-symbols-outlined"
            >skip_next</span
          >
        </Button>
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
  button.case-btn {
    margin-right: 5px;
    width: fit-content;
    cursor: pointer;
  }
</style>
