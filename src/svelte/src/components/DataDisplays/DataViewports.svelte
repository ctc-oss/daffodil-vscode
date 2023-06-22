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
    bytesPerRow,
    editMode,
    editedDataSegment,
    editorEncoding,
    selectionData,
    selectionSize,
    viewportClientHeight,
    viewportLineHeight,
    viewportScrollHeight,
    viewportScrollTop,
    viewportLength,
  } from '../../stores'
  import { UIThemeCSSClass } from '../../utilities/colorScheme'
  import {
    viewport_references,
    type ViewportReferences,
  } from '../../utilities/display'
  import { MessageCommand } from '../../utilities/message'
  import { onMount, tick } from 'svelte'
  import { vscode } from '../../utilities/vscode'
  import { EditByteModes } from '../../stores/configuration'
  import BinaryValueActions from './CustomByteDisplay/BinaryValueActions.svelte'
  import ByteViewports from './ByteViewports.svelte'
  import {
    VIEWPORT_SCROLL_INCREMENT,
    ViewportBoundaryTrigger,
    _viewportData,
    selectedByte,
    viewportData_t,
  } from './CustomByteDisplay/BinaryData'

  const viewportRefs = viewport_references() as ViewportReferences

  //
  // reactive statements
  //

  $: {
    $editMode === EditByteModes.Single
      ? postEditorOnChangeMsg('hex')
      : postEditorOnChangeMsg($editorEncoding)

    // when the viewport length changes, update the viewport geometry
    if ($viewportLength >= 0) {
      populateViewportGeometry()
    }
  }

  function boundary_trigger_handle(
    event: CustomEvent<ViewportBoundaryTrigger>
  ) {
    const trigger = event.detail
    let offset =
      trigger === ViewportBoundaryTrigger.SCROLL_TOP
        ? $viewportData_t.fileOffset - VIEWPORT_SCROLL_INCREMENT
        : $viewportData_t.fileOffset + VIEWPORT_SCROLL_INCREMENT

    vscode.postMessage({
      command: MessageCommand.scrollViewport,
      data: {
        scrollOffset: offset,
        bytesPerRow: $bytesPerRow,
      },
    })
  }

  function populateViewportGeometry() {
    // event handlers expect synchronous functions, so wrap the async function in a sync function
    async function populateViewportGeometryOps_() {
      if (viewportRefs.physical) {
        // wait for the DOM to be updated before getting the viewport geometry
        await tick()
        $viewportScrollTop = viewportRefs.physical.scrollTop
        $viewportScrollHeight = viewportRefs.physical.scrollHeight
        $viewportClientHeight = viewportRefs.physical.clientHeight
        $viewportLineHeight = parseFloat(
          getComputedStyle(viewportRefs.physical).lineHeight
        )
      }
    }

    populateViewportGeometryOps_()
  }

  function postEditorOnChangeMsg(forcedEncoding?: string) {
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        fileOffset: $selectionData.startOffset,
        selectionData: $editedDataSegment,
        encoding: forcedEncoding ? forcedEncoding : $editorEncoding,
        selectionSize: $selectionSize,
        editMode: $editMode,
      },
    })
  }

  onMount(() => {
    populateViewportGeometry()

    // recalculate the viewport geometry when the window is resized
    window.addEventListener('resize', populateViewportGeometry)
  })
</script>

<BinaryValueActions
  byte={$selectedByte}
  on:commitChanges
  on:handleEditorEvent
/>

<ByteViewports
  viewportData={$viewportData_t}
  addressRadix={$addressRadix}
  bytesPerRow={$bytesPerRow}
  on:scrollBoundary={boundary_trigger_handle}
/>

<style lang="scss">
  textarea {
    line-height: 1.2;
  }
  textarea.locked {
    overflow-y: hidden;
  }
  textarea.physical.hexWidth {
    min-width: 300pt;
  }
  textarea.logical.hexWidth {
    min-width: 200pt;
  }
  textarea.physical.decoctWidth {
    min-width: 385pt;
  }
  textarea.logical.decoctWidth {
    min-width: 200pt;
  }
  textarea.physical.binWidth {
    min-width: 435pt;
  }
  textarea.logical.binWidth {
    min-width: 100pt;
  }
</style>
