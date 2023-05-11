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
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import Input from '../../Inputs/Input/Input.svelte'
  import Error from '../../Error/Error.svelte'
  import Button from '../../Inputs/Buttons/Button.svelte'
  import { createEventDispatcher } from 'svelte'
  import {
    RadixOptions,
    encoding_groups,
    enterKeypressEventList,
  } from '../../../stores/Configuration'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
  import { goToErr } from '..'
  import {
    addressValue,
    displayRadix,
    editorEncoding,
    gotoOffset,
    gotoOffsetInput,
    gotoable,
  } from '../../../stores'

  const EventDispatcher = createEventDispatcher()
  const goToInputId = 'goto-input'
  enterKeypressEventList.register({ id: goToInputId, run: goToEventHandler })

  $: $gotoOffset = parseInt($gotoOffsetInput, $addressValue)
  $: $goToErr = $gotoable.gotoErrMsg

  function goToEventHandler() {
    EventDispatcher('goTo')
  }
</script>

<fieldset>
  <legend>Settings</legend>
  <FlexContainer --dir="column">
    <FlexContainer --dir="row" --align-items="center">
      <label for="radix">Byte Display Radix:</label>
      <select class={$UIThemeCSSClass} bind:value={$displayRadix}>
        <option value={RadixOptions.Hexidecimal}>Hexidecimal</option>
        <option value={RadixOptions.Decimal}>Decimal</option>
        <option value={RadixOptions.Octal}>Octal</option>
        <option value={RadixOptions.Binary}>Binary</option>
      </select>
    </FlexContainer>

    <FlexContainer --dir="row" --align-items="center">
      <label for="encoding">Byte Edit Encoding:</label>
      <select class={$UIThemeCSSClass} bind:value={$editorEncoding}>
        {#each encoding_groups as { group, encodings }}
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
      <label for="encoding">Go to Offset:</label>
      <Input id={goToInputId} bind:value={$gotoOffsetInput} --width="40%" />
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
    margin: 5pt 0pt 5pt 0pt;
  }
</style>
