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
<script lang="ts" xmlns="http://www.w3.org/1999/html">
  import { RADIX_OPTIONS, ENCODING_GROUPS } from '../../../stores/configuration'
  import {
    addressRadix,
    displayRadix,
    editorEncoding,
    gotoOffset,
    gotoOffsetInput,
    gotoable,
    viewportFollowingByteCount,
    viewportLength,
    viewportStartOffset,
    viewportScrolledToTop,
    viewportScrolledToEnd,
    viewportScrollTop,
    viewportScrollHeight,
    viewportClientHeight,
    viewportNumLinesDisplayed,
  } from '../../../stores'
  import { goToErr } from '..'
  import Error from '../../Error/Error.svelte'
  import { createEventDispatcher } from 'svelte'
  import Input from '../../Inputs/Input/Input.svelte'
  import Button from '../../Inputs/Buttons/Button.svelte'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
  import {
    viewport_references,
    type ViewportReferences,
  } from '../../../utilities/display'
  import { enterKeypressEvents } from '../../../utilities/enterKeypressEvents'

  const EventDispatcher = createEventDispatcher()
  const goToInputId = 'goto-input'

  enterKeypressEvents.register({ id: goToInputId, run: goToEventHandler })

  $: $gotoOffset = parseInt($gotoOffsetInput, $addressRadix)
  $: $goToErr = $gotoable.gotoErrMsg

  function goToEventHandler() {
    EventDispatcher('goTo')
  }

  function adjustViewportSizes(event: Event) {
    let viewportRefs = viewport_references() as ViewportReferences

    switch ($displayRadix) {
      case RADIX_OPTIONS.Hexadecimal:
        viewportRefs.physical.style.width = '300pt'
        viewportRefs.logical.style.width = '200pt'
        break
      case RADIX_OPTIONS.Octal:
      case RADIX_OPTIONS.Decimal:
        viewportRefs.physical.style.width = '385pt'
        viewportRefs.logical.style.width = '200pt'
        break
      case RADIX_OPTIONS.Binary:
        viewportRefs.physical.style.width = '435pt'
        viewportRefs.logical.style.width = '100pt'
        break
    }
  }
</script>

<fieldset>
  <legend>Settings</legend>
  <FlexContainer --dir="column">
    <FlexContainer --dir="row" --align-items="center">
      <label for="radix">Byte Display Radix:</label>
      <select class={$UIThemeCSSClass} bind:value={$displayRadix}>
        <option value={RADIX_OPTIONS.Hexadecimal}>Hexidecimal</option>
        <option value={RADIX_OPTIONS.Decimal}>Decimal</option>
        <option value={RADIX_OPTIONS.Octal}>Octal</option>
        <option value={RADIX_OPTIONS.Binary}>Binary</option>
      </select>
    </FlexContainer>

    <FlexContainer --dir="row" --align-items="center">
      <label for="encoding">Byte Edit Encoding:</label>
      <select class={$UIThemeCSSClass} bind:value={$editorEncoding}>
        {#each ENCODING_GROUPS as { group, encodings }}
          <optgroup label={group}>
            {#each encodings as { name, value }}
              <option {value}>{name}</option>
            {/each}
          </optgroup>
        {/each}
      </select>
    </FlexContainer>

    <hr />

    <FlexContainer --dir="row" --align-items="center">
      <label for={goToInputId}
        >Go to Offset:
        <Input id={goToInputId} bind:value={$gotoOffsetInput} --width="40%" />
      </label>
      <Error
        err={goToErr}
        display={$gotoOffsetInput.length > 0 && !$gotoable.valid}
      />
    </FlexContainer>

    <FlexContainer --dir="row">
      <Button disabledBy={!$gotoable.valid} fn={goToEventHandler}>
        <span slot="left" class="btn-icon">&#10148</span>
        <span slot="default">Go</span>
      </Button>
    </FlexContainer>

    <!-- Viewport diagnostic information.  TODO: remove once infinite scrolling is working -->
    <FlexContainer --dir="row" --align-items="center">
      <sub>
        Viewport start offset: {$viewportStartOffset}, length: {$viewportLength},
        following byte count: {$viewportFollowingByteCount}, lines: {$viewportNumLinesDisplayed}
        <br />
        Scroll top: {$viewportScrollTop}, scroll height: {$viewportScrollHeight},
        client height: {$viewportClientHeight} <br />
        Scrolled to the top: {$viewportScrolledToTop}, to the end: {$viewportScrolledToEnd}
      </sub>
    </FlexContainer>
  </FlexContainer>
</fieldset>

<style lang="scss">
  fieldset label {
    width: 50%;
  }
  fieldset select {
    width: 50%;
  }
  fieldset hr {
    width: 100%;
    margin: 5pt 0 5pt 0;
  }
</style>
