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
  import type { ByteValue } from './BinaryData'
  import { bytesPerRow } from './BinaryData'
  import BinaryValue from './BinaryValueDiv.svelte'

  export let binaryDataStr: string =
    document.getElementById('physical').innerHTML
  let byteValues: string[] = []
  let binaryData: ByteValue[] = []
  let width
  $: {
    byteValues = binaryDataStr.match(/[0-9a-fA-F]{2}/g) || []
    binaryData = byteValues.map((byteStr, index) => {
      return { text: byteStr, offset: index / 2, value: parseInt(byteStr, 16) }
    })
  }
</script>

<div style="width: calc({$bytesPerRow} * {24}px);">
  {#each binaryData as byte}
    <BinaryValue {byte} />
  {/each}
</div>

<style>
  div {
    display: flex;
    flex-wrap: wrap;
    border-radius: 5px;
    border-width: 2px;
    border-style: solid;
    border-color: var(--color-primary-mid);
    background-color: var(--color-primary-dark);
    overflow: auto;
  }
</style>
