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
    dvInt16,
    dvInt32,
    dvInt64,
    dvInt8,
    dvLatin1,
    dvOffset,
    dvUint16,
    dvUint32,
    dvUint64,
    dvUint8,
    selectionData,
  } from '../../../stores'
  import { ENDIANNESS_OPTIONS } from '../../../stores/configuration'
  import { UIThemeCSSClass } from '../../../utilities/colorScheme'
  import { vscode } from '../../../utilities/vscode'
  import { MessageCommand } from '../../../utilities/message'
  import Input from '../../Inputs/Input/Input.svelte'

  const ERROR_MESSAGE_TIMEOUT = 5000

  let errorMessage: string
  let isEditing = ''

  function handleSubmit(inputValue: string, intType: string): boolean {
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
    let value = NaN
    isEditing = ''
    if (intType === 'latin1') {
      if (inputValue.length !== 1) {
        errorMessage = `Value out of range for ${intType} (${displayRadix}): ${inputValue}`
        setTimeout(() => {
          errorMessage = ''
        }, ERROR_MESSAGE_TIMEOUT)
        return false
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
        return false
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
          return false
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
    return true
  }

  function handleInputEnter(e: CustomEvent) {
    switch (e.detail.id) {
      case 'latin1_dv':
        handleSubmit(e.detail.value, 'latin1')
        break
      case 'int8_dv':
        handleSubmit(e.detail.value, 'int8')
        break
      case 'uint8_dv':
        handleSubmit(e.detail.value, 'uint8')
        break
      case 'int16_dv':
        handleSubmit(e.detail.value, 'int16')
        break
      case 'uint16_dv':
        handleSubmit(e.detail.value, 'uint16')
        break
      case 'int32_dv':
        handleSubmit(e.detail.value, 'int32')
        break
      case 'uint32_dv':
        handleSubmit(e.detail.value, 'uint32')
        break
      case 'int64_dv':
        handleSubmit(e.detail.value, 'int64')
        break
      case 'uint64_dv':
        handleSubmit(e.detail.value, 'uint64')
        break
    }
  }

  function handleBlur() {
    isEditing = ''
  }
</script>

<fieldset class="box margin-top">
  <legend
    >Data {#if $dvOffset}@ {$dvOffset}{/if}</legend
  >
  {#if errorMessage}
    <b>message: {errorMessage}</b><br />
  {/if}
  <div class="input-container">
    <label for="endian" class="label">&nbsp;endian:</label><select
      id="endian"
      class={$UIThemeCSSClass}
      bind:value={$dataViewEndianness}
    >
      {#each ENDIANNESS_OPTIONS as { name, value }}
        <option {value}>{name}</option>
      {/each}
    </select>
  </div>
  {#if $selectionData.active && $dvInt8}
    {#if isEditing === 'latin1'}
      <div class="input-container">
        <label for="latin1_dv" class="label">latin-1:</label>
        <Input
          id="latin1_dv"
          placeholder={$dvLatin1}
          maxlength="1"
          on:inputEnter={handleInputEnter}
          on:inputFocusOut={handleBlur}
          width="64ch"
          autofocus="true"
        />
      </div>
    {:else}
      <div
        class="input-container tooltip"
        id="latin1"
        on:click={() => {
          isEditing = 'latin1'
        }}
      >
        <span class="tooltip-text">click to edit latin-1</span>
        <label for="latin1_dv_ro" class="label">latin-1:</label>
        <span id="latin1_dv_ro" class="nowrap">{$dvLatin1}</span>
      </div>
    {/if}
    {#if isEditing === 'int8'}
      <div class="input-container">
        <label for="int8_dv" class="label">&nbsp;&nbsp;&nbsp;int8:</label>
        <Input
          id="int8_dv"
          placeholder={$dvInt8}
          value={$dvInt8}
          maxlength="8"
          on:inputEnter={handleInputEnter}
          on:inputFocusOut={handleBlur}
          width="64ch"
          autofocus="true"
        />
      </div>
    {:else}
      <div
        class="input-container tooltip"
        on:click={() => {
          isEditing = 'int8'
        }}
      >
        <span class="tooltip-text">click to edit int8</span>
        <label for="int8_dv_ro" class="label">&nbsp;&nbsp;&nbsp;int8:</label>
        <span id="int8_dv_ro" class="nowrap">{$dvInt8}</span>
      </div>
    {/if}
    {#if isEditing === 'uint8'}
      <div class="input-container">
        <label for="uint8_dv" class="label">&nbsp;&nbsp;uint8:</label>
        <Input
          id="uint8_dv"
          placeholder={$dvUint8}
          value={$dvUint8}
          maxlength="8"
          on:inputEnter={handleInputEnter}
          on:inputFocusOut={handleBlur}
          width="64ch"
          autofocus="true"
        />
      </div>
    {:else}
      <div
        class="input-container tooltip"
        on:click={() => {
          isEditing = 'uint8'
        }}
      >
        <span class="tooltip-text">click to edit uint8</span>
        <label for="uint8_dv_ro" class="label">&nbsp;&nbsp;uint8:</label>
        <span id="uint8_dv_ro" class="nowrap">{$dvUint8}</span>
      </div>
    {/if}
    {#if $dvInt16}
      {#if isEditing === 'int16'}
        <div class="input-container">
          <label for="int16_dv" class="label">&nbsp;&nbsp;int16:</label>
          <Input
            id="int16_dv"
            placeholder={$dvInt16}
            value={$dvInt16}
            maxlength="16"
            on:inputEnter={handleInputEnter}
            on:inputFocusOut={handleBlur}
            width="64ch"
            autofocus="true"
          />
        </div>
      {:else}
        <div
          class="input-container tooltip"
          on:click={() => {
            isEditing = 'int16'
          }}
        >
          <span class="tooltip-text">click to edit int16</span>
          <label for="int16_dv_ro" class="label">&nbsp;&nbsp;int16:</label>
          <span id="int16_dv_ro" class="nowrap">{$dvInt16}</span>
        </div>
      {/if}
      {#if isEditing === 'uint16'}
        <div class="input-container">
          <label for="uint16_dv" class="label">&nbsp;uint16:</label>
          <Input
            id="uint16_dv"
            placeholder={$dvUint16}
            value={$dvUint16}
            maxlength="16"
            on:inputEnter={handleInputEnter}
            on:inputFocusOut={handleBlur}
            width="64ch"
            autofocus="true"
          />
        </div>
      {:else}
        <div
          class="input-container tooltip"
          on:click={() => {
            isEditing = 'uint16'
          }}
        >
          <span class="tooltip-text">click to edit uint16</span>
          <label for="uint16_dv_ro" class="label">&nbsp;uint16:</label>
          <span id="uint16_dv_ro" class="nowrap">{$dvUint16}</span>
        </div>
      {/if}
    {/if}
    {#if $dvInt32}
      {#if isEditing === 'int32'}
        <div class="input-container">
          <label for="int32_dv" class="label">&nbsp;&nbsp;int32:</label>
          <Input
            id="int32_dv"
            placeholder={$dvInt32}
            value={$dvInt32}
            maxlength="32"
            on:inputEnter={handleInputEnter}
            on:inputFocusOut={handleBlur}
            width="64ch"
            autofocus="true"
          />
        </div>
      {:else}
        <div
          class="input-container tooltip"
          on:click={() => {
            isEditing = 'int32'
          }}
        >
          <span class="tooltip-text">click to edit int32</span>
          <label for="int32_dv_ro" class="label">&nbsp;&nbsp;int32:</label>
          <span id="int32_dv_ro" class="nowrap">{$dvInt32}</span>
        </div>
      {/if}
      {#if isEditing === 'uint32'}
        <div class="input-container">
          <label for="uint32_dv" class="label">&nbsp;uint32:</label>
          <Input
            id="uint32_dv"
            placeholder={$dvUint32}
            value={$dvUint32}
            maxlength="32"
            on:inputEnter={handleInputEnter}
            on:inputFocusOut={handleBlur}
            width="64ch"
            autofocus="true"
          />
        </div>
      {:else}
        <div
          class="input-container tooltip"
          on:click={() => {
            isEditing = 'uint32'
          }}
        >
          <span class="tooltip-text">click to edit uint32</span>
          <label for="uint32_dv_ro" class="label">&nbsp;uint32:</label>
          <span id="uint32_dv_ro" class="nowrap">{$dvUint32}</span>
        </div>
      {/if}
    {/if}
    {#if $dvInt64}
      {#if isEditing === 'int64'}
        <div class="input-container">
          <label for="int64_dv" class="label">&nbsp;&nbsp;int64:</label>
          <Input
            id="int64_dv"
            placeholder={$dvInt64}
            value={$dvInt64}
            maxlength="64"
            on:inputEnter={handleInputEnter}
            on:inputFocusOut={handleBlur}
            width="64ch"
            autofocus="true"
          />
        </div>
      {:else}
        <div
          class="input-container tooltip"
          on:click={() => {
            isEditing = 'int64'
          }}
        >
          <span class="tooltip-text">click to edit int64</span>
          <label for="int64_dv_ro" class="label">&nbsp;&nbsp;int64:</label>
          <span id="int64_dv_ro" class="nowrap">{$dvInt64}</span>
        </div>
      {/if}
      {#if isEditing === 'uint64'}
        <div class="input-container">
          <label for="uint64_dv" class="label">&nbsp;uint64:</label>
          <Input
            id="uint64_dv"
            placeholder={$dvUint64}
            value={$dvUint64}
            maxlength="64"
            on:inputEnter={handleInputEnter}
            on:inputFocusOut={handleBlur}
            width="64ch"
            autofocus="true"
          />
        </div>
      {:else}
        <div
          class="input-container tooltip"
          on:click={() => {
            isEditing = 'uint64'
          }}
        >
          <span class="tooltip-text">click to edit uint64</span>
          <label for="uint64_dv_ro" class="label">&nbsp;uint64:</label>
          <span id="uint64_dv_ro" class="nowrap">{$dvUint64}</span>
        </div>
      {/if}
    {/if}
  {/if}
</fieldset>

<style lang="scss">
  select {
    width: 64ch;
  }
  .input-container {
    display: flex;
    align-items: center;
  }
  .label {
    margin-right: 8px;
    white-space: nowrap;
    overflow-wrap: break-word;
  }
</style>
