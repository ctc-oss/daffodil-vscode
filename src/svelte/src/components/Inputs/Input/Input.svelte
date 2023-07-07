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
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
  import { createEventDispatcher, onMount } from 'svelte'
  const eventDispatcher = createEventDispatcher()

  type InputTypes = 'search' | 'text' | 'checkbox'

  export let allowDefaultInput: string = 'false'
  export let autofocus: string = 'false'
  export let id: string = ''
  export let maxlength: number = 100
  export let placeholder: string = ''
  export let inputType: InputTypes = 'search' // default to search for the clear button
  export let value: string = ''
  export let width: string = '100%'

  let containerClass: string
  let inlineClass: string
  let inputClass: string
  let initialValue: string
  let allowDefaultInputBool: boolean

  // this is a reference to the input element
  let thisElement: HTMLInputElement

  function CSSThemeClass(selectors?: string) {
    return selectors + ' ' + $UIThemeCSSClass
  }

  $: {
    containerClass = CSSThemeClass('input-actions')
    inlineClass = CSSThemeClass('inline-container')
    inputClass = CSSThemeClass('actionable')
  }

  // need this to avoid 2-way type binding
  const setType = (node: HTMLInputElement, _type: string) => {
    node.type = _type
    return {
      update(_type: string) {
        node.type = _type
      },
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    // if the user presses enter, and the input is not empty, and the input has changed, then dispatch an event
    if (
      event.key === 'Enter' &&
      (allowDefaultInputBool ||
        (thisElement.value !== '' && thisElement.value !== initialValue))
    ) {
      eventDispatcher('inputEnter', {
        id,
        initialValue,
        value: thisElement.value,
      })
    } else {
      value += event.key
    }
  }

  function handleFocus(event: FocusEvent) {
    // if the input has changed focus, dispatch an event
    switch (event.type) {
      case 'focusin':
        eventDispatcher('inputFocusIn', {
          id,
          initialValue,
          value: thisElement.value,
        })
        break
      case 'focusout':
        eventDispatcher('inputFocusOut', {
          id,
          initialValue,
          value: thisElement.value,
        })
        break
    }
  }

  onMount(() => {
    // save the initial value of the input element, so we can check if it has changed later
    initialValue = value
    // need a boolean value for this
    allowDefaultInputBool = allowDefaultInput.toLowerCase() === 'true'
    // focus the input element when the component is mounted
    if (autofocus.toLowerCase() === 'true') {
      thisElement.focus()
    }
  })
</script>

{#if inputType === 'text' || inputType === 'search'}
  <span
    class={containerClass}
    {id}
    on:focusin={handleFocus}
    on:focusout={handleFocus}
    style="width: {width};"
  >
    <span class={inlineClass}>
      <input
        use:setType={inputType}
        class="{$UIThemeCSSClass} {inputType}"
        bind:this={thisElement}
        bind:value
        {placeholder}
        {maxlength}
        on:blur
        on:change
        on:click
        on:contextmenu
        on:focus
        on:input
        on:keydown={handleKeyPress}
        on:keypress
        on:keyup
        on:mouseenter
        on:mouseleave
        on:mouseover
        on:paste
      />
    </span>
  </span>
  <slot />
{/if}

<style lang="scss">
  .checkbox {
    width: auto;
  }
</style>
