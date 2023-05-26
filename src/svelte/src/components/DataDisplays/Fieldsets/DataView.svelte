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
    displayRadix,
    dataView,
    addressRadix,
  } from '../../../stores'
  import { ENDIANNESS_OPTIONS } from '../../../stores/configuration'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import { selectionData } from '../../Editors/DataEditor'

  let dataViewOffset = ''
  let dataViewLatin1 = ''
  let dataViewInt8 = ''
  let dataViewUint8 = ''
  let dataViewInt16 = ''
  let dataViewUint16 = ''
  let dataViewInt32 = ''
  let dataViewUint32 = ''
  let dataViewInt64 = ''
  let dataViewUint64 = ''

  $: {
    dataViewOffset = $selectionData.active
      ? $selectionData.startOffset.toString($addressRadix).toUpperCase()
      : ''

    dataViewLatin1 =
      $selectionData.active && $dataView.byteLength >= 1
        ? String.fromCharCode($dataView.getUint8(0))
        : ''

    dataViewInt8 =
      $selectionData.active && $dataView.byteLength >= 1
        ? $dataView.getInt8(0).toString($displayRadix).toUpperCase()
        : ''

    dataViewUint8 =
      $selectionData.active && $dataView.byteLength >= 1
        ? $dataView.getUint8(0).toString($displayRadix).toUpperCase()
        : ''

    dataViewInt16 =
      $selectionData.active && $dataView.byteLength >= 2
        ? $dataView
            .getInt16(0, $dataViewEndianness === 'le')
            .toString($displayRadix)
            .toUpperCase()
        : ''

    dataViewUint16 =
      $selectionData.active && $dataView.byteLength >= 2
        ? $dataView
            .getUint16(0, $dataViewEndianness === 'le')
            .toString($displayRadix)
            .toUpperCase()
        : ''

    dataViewInt32 =
      $selectionData.active && $dataView.byteLength >= 4
        ? $dataView
            .getInt32(0, $dataViewEndianness === 'le')
            .toString($displayRadix)
            .toUpperCase()
        : ''

    dataViewUint32 =
      $selectionData.active && $dataView.byteLength >= 4
        ? $dataView
            .getUint32(0, $dataViewEndianness === 'le')
            .toString($displayRadix)
            .toUpperCase()
        : ''

    dataViewInt64 =
      $selectionData.active && $dataView.byteLength >= 8
        ? $dataView
            .getBigInt64(0, $dataViewEndianness === 'le')
            .toString($displayRadix)
            .toUpperCase()
        : ''

    dataViewUint64 =
      $selectionData.active && $dataView.byteLength >= 8
        ? $dataView
            .getBigUint64(0, $dataViewEndianness === 'le')
            .toString($displayRadix)
            .toUpperCase()
        : ''
  }
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
      <label
        >&nbsp;Offset: <text-field id="offset_dv">{dataViewOffset}</text-field
        ></label
      >
      <span id="b8_dv">
        <br /><label
          >latin-1: <text-field id="latin1_dv">{dataViewLatin1}</text-field
          ></label
        >
        <br /><label
          >&nbsp;&nbsp;&nbsp;int8: <text-field id="int8_dv"
            >{dataViewInt8}</text-field
          ></label
        >
        <br /><label
          >&nbsp;&nbsp;uint8: <text-field id="uint8_dv"
            >{dataViewUint8}</text-field
          ></label
        >
      </span>
      <span id="b16_dv">
        <br /><label
          >&nbsp;&nbsp;int16: <text-field id="int16_dv"
            >{dataViewInt16}</text-field
          ></label
        >
        <br /><label
          >&nbsp;uint16: <text-field id="uint16_dv">{dataViewUint16}</text-field
          ></label
        >
      </span>
      <span id="b32_dv">
        <br /><label
          >&nbsp;&nbsp;int32: <text-field id="int32_dv"
            >{dataViewInt32}</text-field
          ></label
        >
        <br /><label
          >&nbsp;uint32: <text-field id="uint32_dv">{dataViewUint32}</text-field
          ></label
        >
      </span>
      <span id="b64_dv">
        <br /><label
          >&nbsp;&nbsp;int64: <text-field id="int64_dv"
            >{dataViewInt64}</text-field
          ></label
        >
        <br /><label
          >&nbsp;uint64: <text-field id="uint64_dv">{dataViewUint64}</text-field
          ></label
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
