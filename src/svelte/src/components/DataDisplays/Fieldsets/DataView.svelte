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
    dataViewEndianness,
    int64,
    uint64,
    int32,
    uint32,
    int16,
    uint16,
    int8,
    uint8,
    dataViewOffsetText,
    latin1,
  } from '../../../stores'
  import { ENDIANNESS_OPTIONS } from '../../../stores/configuration'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
</script>

<fieldset class="box margin-top">
  <legend>Data View</legend>
  <FlexContainer>
    <FlexContainer --width="50%">
      <label for="endianness">Endianness: </label>
      <select
        id="endianness"
        class={$UIThemeCSSClass}
        bind:value={$dataViewEndianness}
      >
        {#each ENDIANNESS_OPTIONS as { name, value }}
          <option {value}>{name}</option>
        {/each}
      </select>
    </FlexContainer>
  </FlexContainer>
  <FlexContainer>
    <div id="data_vw">
      <label for="offset_dv"
        >&nbsp;Offset: <text-field id="offset_dv" />{$dataViewOffsetText}</label
      >
      <span id="b8_dv">
        <br /><label for="latin1_dv"
          >latin-1: <text-field id="latin1_dv" />{$latin1}</label
        >
        <br /><label for="int8_dv"
          >&nbsp;&nbsp;&nbsp;int8: <text-field id="int8_dv" />{$int8}</label
        >
        <br /><label for="uint8_dv"
          >&nbsp;&nbsp;uint8: <text-field id="uint8_dv" />{$uint8}</label
        >
      </span>
      <span id="b16_dv">
        <br /><label for="int16_dv"
          >&nbsp;&nbsp;int16: <text-field id="int16_dv" />{$int16}</label
        >
        <br /><label for="uint16_dv"
          >&nbsp;uint16: <text-field id="uint16_dv" />{$uint16}</label
        >
      </span>
      <span id="b32_dv">
        <br /><label for="int32_dv"
          >&nbsp;&nbsp;int32: <text-field id="int32_dv" />{$int32}</label
        >
        <br /><label for="uint32_dv"
          >&nbsp;uint32: <text-field id="uint32_dv" />{$uint32}</label
        >
      </span>
      <span id="b64_dv">
        <br /><label for="int64_dv"
          >&nbsp;&nbsp;int64: <text-field id="int64_dv" />{$int64}</label
        >
        <br /><label for="uint64_dv"
          >&nbsp;uint64: <text-field id="uint64_dv" />{$uint64}</label
        >
      </span>
    </div>
  </FlexContainer>
</fieldset>

<style lang="scss">
  label {
    width: 50%;
  }
  select {
    width: 25%;
  }
  label,
  select {
    min-width: fit-content;
  }
</style>
