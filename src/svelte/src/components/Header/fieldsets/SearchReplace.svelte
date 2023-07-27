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
    seekable,
    seekOffsetInput,
  } from '../../../stores'
  import {
    replaceable,
    replaceErr,
    replaceQuery,
    searchable,
    searchErr,
    searchQuery,
    seekErr,
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
  import { updateSearchResultsHighlights } from '../../../utilities/highlights'
  import { viewport } from '../../DataDisplays/CustomByteDisplay/BinaryData'
  import {
    EditActionRestrictions,
    editorActionsAllowed,
    SEARCH_AND_REPLACE_MAX_RESULTS,
  } from '../../../stores/configuration'

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

  let searchReplaceButtonWidth = '85pt'
  let searchNavButtonWidth = '55pt'
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
        limit: SEARCH_AND_REPLACE_MAX_RESULTS,
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
        limit: SEARCH_AND_REPLACE_MAX_RESULTS,
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
        overwriteOnly:
          $editorActionsAllowed === EditActionRestrictions.OverwriteOnly,
        startOffset: startOffset,
        replaceStrategy: strategy,
        limit: SEARCH_AND_REPLACE_MAX_RESULTS,
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
        $searchQuery.overflow = msg.data.data.overflow
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
        updateSearchResultsHighlights(
          $searchQuery.searchResults,
          $viewport.fileOffset,
          $searchQuery.input.length
        )

        break

      case MessageCommand.replaceResults:
        $searchQuery.processing = false
        $replaceQuery.processing = false
        $replaceQuery.overflow = msg.data.data.overflow
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
            updateSearchResultsHighlights(
              $searchQuery.searchResults,
              $viewport.fileOffset,
              $searchQuery.input.length
            )
            // reset replace query count after 5 seconds
            setTimeout(() => {
              $replaceQuery.count = -1
            }, 5000)
            break

          case ReplaceStrategy.ReplaceAll:
            showReplaceOptions = false
            $searchQuery.searchResults = []
            $replaceQuery.count = msg.data.data.replacementsCount
            updateSearchResultsHighlights(
              $searchQuery.searchResults,
              $viewport.fileOffset,
              $searchQuery.input.length
            )
            // reset replace query count after 5 seconds
            setTimeout(() => {
              $replaceQuery.count = -1
            }, 5000)
            break
        }
        break
      case MessageCommand.viewportRefresh:
        updateSearchResultsHighlights(
          $searchQuery.searchResults,
          $viewport.fileOffset,
          $searchQuery.input.length
        )
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
        width={searchReplaceButtonWidth}
        description="Seek to offset"
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
            description="Case sensitive search: {$searchCaseInsensitive}"
          >
            Aa
          </ToggleableButton>
        </Input>
      {:else}
        <Input
          id="search"
          placeholder="Search"
          bind:value={$searchQuery.input}
          on:inputEnter={handleInputEnter}
        />
      {/if}
      <Error err={searchErr} display={searchErrDisplay} />
      <Button
        disabledBy={!$searchable}
        fn={search}
        width={searchReplaceButtonWidth}
        description="Start search"
      >
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
      <Button
        disabledBy={!$replaceable}
        fn={startReplace}
        width={searchReplaceButtonWidth}
        description="Start replacement"
      >
        <span slot="left" class="btn-icon material-symbols-outlined"
          >find_replace</span
        >
        <span slot="default">&nbsp;Replace&hellip;</span>
      </Button>
    </FlexContainer>

    {#if !showReplaceOptions && $searchQuery.searchResults.length > 1}
      <FlexContainer --dir="row">
        <Button
          width={searchNavButtonWidth}
          fn={scrollSearchFirst}
          description="Seek to first result"
        >
          <span slot="left" class="btn-icon material-symbols-outlined"
            >first_page</span
          >
          <span slot="default">&nbsp;First</span></Button
        >
        <Button
          width={searchNavButtonWidth}
          fn={scrollSearchPrev}
          description="Previous result"
        >
          <span slot="left" class="btn-icon material-symbols-outlined"
            >navigate_before</span
          >
          <span slot="default">&nbsp;Prev</span></Button
        >
        <Button
          width={searchNavButtonWidth}
          fn={scrollSearchNext}
          description="Next result"
        >
          <span slot="default">Next&nbsp;</span>
          <span slot="right" class="btn-icon material-symbols-outlined"
            >navigate_next</span
          ></Button
        >
        <Button
          width={searchNavButtonWidth}
          fn={scrollSearchLast}
          description="Seek to last result"
        >
          <span slot="default">Last&nbsp;</span>
          <span slot="right" class="btn-icon material-symbols-outlined"
            >last_page</span
          ></Button
        >
      </FlexContainer>
      <FlexContainer --dir="row">
        <sub
          >{$searchQuery.overflow ? 'top ' : ''}{$searchQuery.searchIndex + 1} /
          {$searchQuery.searchResults.length}{$searchQuery.overflow ? '+' : ''}
          Results</sub
        >
      </FlexContainer>
    {/if}
    {#if showReplaceOptions}
      <FlexContainer --dir="row">
        <Button fn={replaceOne} description="Replace one">
          <span slot="left" class="icon-container">
            <span class="btn-icon material-symbols-outlined">find_replace</span>
            <div class="icon-badge">1</div>
          </span>
          <span slot="default">&nbsp;One</span></Button
        >
        <Button fn={replaceAll} description="Replace all results">
          <span slot="left" class="icon-container">
            <span class="btn-icon material-symbols-outlined">find_replace</span>
            <div class="icon-badge">
              {#if $searchQuery.overflow}
                {$searchQuery.overflow ? 'top ' : ''}{$searchQuery.searchResults
                  .length}
              {:else}
                {$searchQuery.searchResults.length + $replaceQuery.skipCount}
              {/if}
            </div>
          </span>
          <span slot="default">&nbsp;All</span></Button
        >
        <Button fn={replaceRest} description="Replace remaining results">
          <span slot="left" class="icon-container">
            <span class="btn-icon material-symbols-outlined">find_replace</span>
            <div class="icon-badge">
              {$searchQuery.overflow ? 'top ' : ''}{$searchQuery.searchResults
                .length}
            </div>
          </span>
          <span slot="default">&nbsp;Rest</span></Button
        >
        <Button
          fn={skipReplace}
          disabledBy={$searchQuery.searchResults.length <= 1}
          description="Skip this replacement"
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
