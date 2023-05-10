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

  export let value

  type InputTypes = 'text' | 'checkbox'
  export let type: InputTypes = 'text'
</script>

{#if type === 'text'}
  <input type="text" class={$UIThemeCSSClass + ' text'} bind:value />
  <slot />
{:else if type === 'checkbox'}
  <input
    type="checkbox"
    class={$UIThemeCSSClass + ' checkbox'}
    bind:checked={value}
  />
{/if}

<style lang="scss">
  .checkbox {
    width: auto;
  }
</style>
