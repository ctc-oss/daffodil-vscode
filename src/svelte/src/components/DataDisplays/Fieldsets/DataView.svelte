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
  import { selectionData } from '../../Editors/DataEditor'
  import { vscode } from '../../../utilities/vscode'
  import { MessageCommand } from '../../../utilities/message'

  const ERROR_MESSAGE_TIMEOUT = 5000
  let errorMessage: string

  let dataViewOffset: string
  let dataViewLatin1: string
  let dataViewInt8: string
  let dataViewUint8: string
  let dataViewInt16: string
  let dataViewUint16: string
  let dataViewInt32: string
  let dataViewUint32: string
  let dataViewInt64: string
  let dataViewUint64: string

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

  function handleSubmit(e: SubmitEvent, intType) {
    // determine the byteSize, minValue, and maxValue for the given intType
    const rangeChecks = {
      int8: [1, -128, 127],
      uint8: [1, 0, 255],
      int16: [2, -32768, 32767],
      uint16: [2, 0, 65535],
      int32: [4, -2147483648, 2147483647],
      uint32: [4, 0, 4294967295],
      int64: [8, -9223372036854775808, 9223372036854775807],
      uint64: [8, 0, 18446744073709551615],
    }
    const form = e.target as HTMLFormElement // Get the form from the event target
    const inputValue = form.elements['val'].value // Retrieve the input value
    let value = NaN
    if (intType === 'latin1') {
      if (inputValue.length !== 1) {
        errorMessage = `Value out of range for ${intType} (${displayRadix}): ${inputValue}`
        setTimeout(() => {
          errorMessage = ''
        }, ERROR_MESSAGE_TIMEOUT)
        form.reset()
        return
      }
      // latin1 is a special case, since it's a single character, not a number, so we use charCodeAt to get the value of
      // the character at index 0 in the string and store it in value as an integer and set intType to uint8
      value = inputValue.charCodeAt(0)
      intType = 'uint8'
    } else {
      value = parseInt(inputValue, $displayRadix)
    }
    if (!isNaN(value) && rangeChecks.hasOwnProperty(intType)) {
      const [byteSize, minValue, maxValue] = rangeChecks[intType]
      if (value < minValue || value > maxValue) {
        errorMessage = `Value out of range for ${intType}: ${value}`
        setTimeout(() => {
          errorMessage = ''
        }, ERROR_MESSAGE_TIMEOUT)
        form.reset()
        return
      }

      const dv = new DataView(new ArrayBuffer(byteSize))
      const littleEndian = $dataViewEndianness === 'le'

      switch (intType) {
        case 'int8':
          dv.setInt8(0, value)
          break
        case 'uint8':
          dv.setUint8(0, value)
          break
        case 'int16':
          dv.setInt16(0, value, littleEndian)
          break
        case 'uint16':
          dv.setUint16(0, value, littleEndian)
          break
        case 'int32':
          dv.setInt32(0, value, littleEndian)
          break
        case 'uint32':
          dv.setUint32(0, value, littleEndian)
          break
        case 'int64':
          dv.setBigInt64(0, BigInt(value), littleEndian)
          break
        case 'uint64':
          dv.setBigUint64(0, BigInt(value), littleEndian)
          break
        default:
          console.error('Invalid integer type: ' + intType)
          form.reset()
          return
      }

      // Send edit to the extension
      vscode.postMessage({
        command: MessageCommand.commit,
        data: {
          offset: $selectionData.startOffset,
          originalSegment: new Uint8Array($dataView.buffer, 0, byteSize),
          editedSegment: new Uint8Array(dv.buffer, 0, byteSize),
        },
      })
    } else {
      errorMessage = `Invalid value ${inputValue} (radix ${$displayRadix}) for ${intType}`
      setTimeout(() => {
        errorMessage = ''
      }, ERROR_MESSAGE_TIMEOUT)
    }
    form.reset()
  }
</script>

<fieldset class="box margin-top">
  <legend
    >Data View{#if dataViewOffset}&nbsp;@ Offset {dataViewOffset}{/if}</legend
  >
  {#if errorMessage}
    <b>message: {errorMessage}</b><br />
  {/if}
  <label for="endian"
    >&nbsp;endian: <select
      id="endian"
      class={$UIThemeCSSClass}
      bind:value={$dataViewEndianness}
    >
      {#each ENDIANNESS_OPTIONS as { name, value }}
        <option {value}>{name}</option>
      {/each}
    </select>
  </label>
  {#if $selectionData.active && dataViewInt8}
    <div id="data_vw">
      <span id="b8_dv">
        <form on:submit|preventDefault={(e) => handleSubmit(e, 'latin1')}>
          <label for="latin1_dv"
            >latin-1: <input
              class={$UIThemeCSSClass}
              name="val"
              id="latin1_dv"
              placeholder={dataViewLatin1}
              maxlength="1"
            /></label
          >
        </form>
        <form on:submit|preventDefault={(e) => handleSubmit(e, 'int8')}>
          <label for="int8_dv"
            >&nbsp;&nbsp;&nbsp;int8: <input
              class={$UIThemeCSSClass}
              name="val"
              id="int8_dv"
              placeholder={dataViewInt8}
            /></label
          >
        </form>
        <form on:submit|preventDefault={(e) => handleSubmit(e, 'uint8')}>
          <label for="uint8_dv"
            >&nbsp;&nbsp;uint8: <input
              class={$UIThemeCSSClass}
              name="val"
              id="uint8_dv"
              placeholder={dataViewUint8}
            /></label
          >
        </form>
      </span>
      {#if dataViewInt16}
        <span id="b16_dv">
          <form on:submit|preventDefault={(e) => handleSubmit(e, 'int16')}>
            <label for="int16_dv"
              >&nbsp;&nbsp;int16: <input
                class={$UIThemeCSSClass}
                name="val"
                id="int16_dv"
                placeholder={dataViewInt16}
              /></label
            >
          </form>
          <form on:submit|preventDefault={(e) => handleSubmit(e, 'uint16')}>
            <label for="uint16_dv"
              >&nbsp;uint16: <input
                class={$UIThemeCSSClass}
                name="val"
                id="uint16_dv"
                placeholder={dataViewUint16}
              /></label
            >
          </form>
        </span>
      {/if}
      {#if dataViewInt32}
        <span id="b32_dv">
          <form on:submit|preventDefault={(e) => handleSubmit(e, 'int32')}>
            <label for="int32_dv"
              >&nbsp;&nbsp;int32: <input
                class={$UIThemeCSSClass}
                name="val"
                id="int32_dv"
                placeholder={dataViewInt32}
              /></label
            >
          </form>
          <form on:submit|preventDefault={(e) => handleSubmit(e, 'uint32')}>
            <label for="uint32_dv"
              >&nbsp;uint32: <input
                class={$UIThemeCSSClass}
                name="val"
                id="uint32_dv"
                placeholder={dataViewUint32}
              /></label
            >
          </form>
        </span>
      {/if}
      {#if dataViewInt64}
        <span id="b64_dv">
          <form on:submit|preventDefault={(e) => handleSubmit(e, 'int64')}>
            <label for="int64_dv"
              >&nbsp;&nbsp;int64: <input
                class={$UIThemeCSSClass}
                name="val"
                id="int64_dv"
                placeholder={dataViewInt64}
              /></label
            >
          </form>
          <form on:submit|preventDefault={(e) => handleSubmit(e, 'uint64')}>
            <label for="uint64_dv"
              >&nbsp;uint64: <input
                class={$UIThemeCSSClass}
                name="val"
                id="uint64_dv"
                placeholder={dataViewUint64}
              /></label
            >
          </form>
        </span>
      {/if}
    </div>
  {/if}
</fieldset>

<style lang="scss">
  label {
    min-width: fit-content;
    display: inline-block;
    text-align: right;
  }
  input,
  select {
    width: 32ch;
  }
  form {
    padding: 0;
    margin: 2px;
  }
</style>
