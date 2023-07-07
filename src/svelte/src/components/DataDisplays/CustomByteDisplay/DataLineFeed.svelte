<script lang="ts">
  import {
    editMode,
    editedDataSegment,
    editorEncoding,
    focusedViewportId,
    selectionData,
    selectionSize,
  } from '../../../stores'
  import { onMount, tick } from 'svelte'
  import {
    byte_value_string,
    selectedByte,
    type ByteValue,
    type ViewportData_t,
    null_byte,
    type ByteSelectionEvent,
    update_byte_action_offsets,
  } from './BinaryData'
  import { fileMetrics } from '../../Header/fieldsets/FileMetrics'
  import {
    EditByteModes,
    type BytesPerRow,
    type RadixValues,
  } from '../../../stores/configuration'
  import DataValue from './DataValue.svelte'
  import { vscode } from '../../../utilities/vscode'
  import { MessageCommand } from '../../../utilities/message'
  import Button from '../../Inputs/Buttons/Button.svelte'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import FileTraversalIndicator from './FileTraversalIndicator.svelte'

  export let bytesPerRow: BytesPerRow = 16
  export let dataRadix: RadixValues = 16
  export let addressRadix: RadixValues = 16
  export let viewportData: ViewportData_t

  const NUM_LINES_DISPLAYED = 20
  const DEBOUNCE_TIMEOUT_MS = 20
  const CONTAINER_ID = 'viewportData-container'

  function OFFSET_FETCH_ADJUSTMENT(direction: ViewportScrollDirection) {
    if (direction === ViewportScrollDirection.INCREMENT) {
      const fetchBound = viewportData.fileOffset + 512
      if (fetchBound > $fileMetrics.computedSize)
        return (
          (fetchBound - $fileMetrics.computedSize / bytesPerRow) * bytesPerRow
        )
      return fetchBound
    } else {
      const validBytesRemaining = viewportData.fileOffset - 512 > 0
      if (!validBytesRemaining) return 0
      else {
        return viewportData.fileOffset - 512
      }
    }
  }

  const INCREMENT_LINE = () => {
    handle_navigation(ViewportScrollDirection.INCREMENT)
  }
  const DECREMENT_LINE = () => {
    handle_navigation(ViewportScrollDirection.DECREMENT)
  }
  const INCREMENT_SEGMENT = () => {
    handle_navigation(ViewportScrollDirection.INCREMENT, NUM_LINES_DISPLAYED)
  }
  const DECREMENT_SEGMENT = () => {
    handle_navigation(ViewportScrollDirection.DECREMENT, -NUM_LINES_DISPLAYED)
  }
  const SCROLL_TO_END = () => {
    if ($fileMetrics.computedSize > 1024) {
      vscode.postMessage({
        command: MessageCommand.scrollViewport,
        data: {
          scrollOffset:
            Math.ceil(($fileMetrics.computedSize - 1024) / bytesPerRow) *
            bytesPerRow,
          bytesPerRow: bytesPerRow,
        },
      })
      lineTopOnRefresh = lineTopMaxViewport
      awaitViewportScroll = true
    } else lineTop = lineTopMaxViewport
  }
  const SCROLL_TO_TOP = () => {
    vscode.postMessage({
      command: MessageCommand.scrollViewport,
      data: {
        scrollOffset: 0,
        bytesPerRow: bytesPerRow,
      },
    })
    lineTopOnRefresh = 0
    awaitViewportScroll = true
  }

  let lineTop = 0
  let totalLinesPerFilesize = 0
  let totalLinesPerViewport = 0
  let lineTopMaxViewport = 64
  let lineTopMaxFile = 64
  let viewportFileSegment = 1
  let atViewportHead = true
  let atViewportTail = false
  let atFileHead = true
  let atFileTail = false
  let awaitViewportScroll = false
  let lineTopOnRefresh = 0
  let height = `calc(${NUM_LINES_DISPLAYED} * 20)px`
  let scrollDebounce: NodeJS.Timeout | null = null

  type ViewportLineData = {
    offset: string
    fileLine: number
    bytes: Array<ByteValue>
    highlight: 'even' | 'odd'
  }

  enum ViewportScrollDirection {
    DECREMENT = -1,
    INCREMENT = 1,
  }

  let viewportLines: Array<ViewportLineData> = []
  let viewportDataContainer: HTMLDivElement

  onMount(() => {
    viewportDataContainer = document.getElementById(
      CONTAINER_ID
    ) as HTMLDivElement
    viewportDataContainer.addEventListener('wheel', navigation_wheel_event)
  })

  $: {
    totalLinesPerFilesize = Math.ceil($fileMetrics.computedSize / bytesPerRow)
    totalLinesPerViewport = Math.ceil(viewportData.data.length / bytesPerRow)
    lineTopMaxFile = Math.max(totalLinesPerFilesize - NUM_LINES_DISPLAYED, 0)
    lineTopMaxViewport = Math.max(
      totalLinesPerViewport - NUM_LINES_DISPLAYED,
      0
    )
    viewportFileSegment = viewportData.fileOffset / viewportData.length + 1

    atViewportHead = lineTop === 0
    atViewportTail = lineTop === lineTopMaxViewport
    atFileHead = viewportData.fileOffset === 0
    atFileTail = viewportData.bytesLeft === 0
  }

  $: {
    if (viewportData.fileOffset >= 0 && !awaitViewportScroll)
      viewportLines = generate_line_data(
        lineTop,
        dataRadix,
        addressRadix,
        bytesPerRow
      )
  }

  function generate_line_data(
    startIndex: number,
    dataRadix: RadixValues,
    addressRadix: RadixValues,
    bytesPerRow: BytesPerRow,
    endIndex: number = startIndex + (NUM_LINES_DISPLAYED - 1)
  ): Array<ViewportLineData> {
    let ret = []
    for (let i = startIndex; i <= endIndex; i++) {
      const viewportLineOffset = i * bytesPerRow
      const fileOffset = viewportLineOffset + viewportData.fileOffset

      let bytes: Array<ByteValue> = []
      const highlight = i % 2 === 0

      for (let bytePos = 0; bytePos < bytesPerRow; bytePos++) {
        let byteOffset = viewportLineOffset + bytePos
        bytes.push({
          offset: byteOffset,
          value: viewportData.data[byteOffset],
          text:
            byteOffset < viewportData.length
              ? byte_value_string(viewportData.data[byteOffset], dataRadix)
              : '',
        })
      }

      ret.push({
        offset: fileOffset.toString(addressRadix).padStart(8, '0'),
        fileLine: fileOffset / bytesPerRow,
        bytes: bytes,
        highlight: highlight ? 'even' : 'odd',
      })
    }
    return ret
  }

  function navigation_keydown_event(event: KeyboardEvent) {
    event.preventDefault() // Prevent page scrolling
    const { key, shiftKey } = event
    if (key === 'PageDown' || key === 'ArrowDown')
      shiftKey ? INCREMENT_SEGMENT() : INCREMENT_LINE()
    else if (key === 'PageUp' || key === 'ArrowUp')
      shiftKey ? DECREMENT_SEGMENT() : DECREMENT_LINE()
    else if (key === 'Home') DECREMENT_SEGMENT()
    else if (key === 'End') INCREMENT_SEGMENT()
  }

  function navigation_wheel_event(event: WheelEvent) {
    event.preventDefault()

    if (scrollDebounce) clearTimeout(scrollDebounce)

    scrollDebounce = setTimeout(() => {
      scrollDebounce = null
      const direction: ViewportScrollDirection = Math.sign(event.deltaY)

      handle_navigation(direction)
    }, DEBOUNCE_TIMEOUT_MS)
  }

  function at_scroll_boundary(direction: ViewportScrollDirection): boolean {
    return direction === ViewportScrollDirection.DECREMENT
      ? atViewportHead && atFileHead
      : atViewportTail && atFileTail
  }

  function handle_navigation(
    direction: ViewportScrollDirection,
    linesToMove: number = direction
  ) {
    if (at_scroll_boundary(direction)) return

    if (at_fetch_boundary(direction, linesToMove)) {
      const viewportOffset = viewportData.fileOffset
      const lineTopOffset = viewportLines[0].bytes[0].offset
      const nextViewportOffset = OFFSET_FETCH_ADJUSTMENT(direction)

      vscode.postMessage({
        command: MessageCommand.scrollViewport,
        data: {
          scrollOffset: nextViewportOffset,
          bytesPerRow: bytesPerRow,
        },
      })
      awaitViewportScroll = true

      lineTopOnRefresh =
        Math.floor(
          (viewportOffset + lineTopOffset - nextViewportOffset) / bytesPerRow
        ) + linesToMove
      return
    }

    const newLine = lineTop + linesToMove
    lineTop = Math.max(0, Math.min(newLine, lineTopMaxViewport))
  }

  function at_fetch_boundary(
    direction: ViewportScrollDirection,
    linesToMove: number = direction
  ): boolean {
    if (linesToMove != direction)
      return direction === ViewportScrollDirection.INCREMENT
        ? lineTop + linesToMove >= lineTopMaxViewport && !atFileTail
        : lineTop + linesToMove <= 0 && !atFileHead

    return direction === ViewportScrollDirection.INCREMENT
      ? atViewportTail && !atFileTail
      : atViewportHead && !atFileHead
  }

  function mousedown(event: CustomEvent<ByteSelectionEvent>) {
    selectionData.update((selections) => {
      selections.active = false
      selections.startOffset = event.detail.targetByte.offset
      selections.endOffset = -1
      selections.originalEndOffset = -1
      return selections
    })
  }

  function mouseup(event: CustomEvent<ByteSelectionEvent>) {
    selectionData.update((selections) => {
      selections.active = true
      selections.endOffset = event.detail.targetByte.offset
      selections.originalEndOffset = event.detail.targetByte.offset
      adjust_event_offsets()
      return selections
    })

    set_byte_selection(event.detail)
  }

  function adjust_event_offsets() {
    const start = $selectionData.startOffset
    const end = $selectionData.endOffset

    if (start > end) {
      $selectionData.startOffset = end
      $selectionData.originalEndOffset = start
      $selectionData.endOffset = start
    }
  }

  function set_byte_selection(selectionEvent: ByteSelectionEvent) {
    $focusedViewportId = selectionEvent.fromViewport

    $selectedByte =
      $editMode === EditByteModes.Single
        ? selectionEvent.targetByte
        : null_byte()

    update_byte_action_offsets(selectionEvent.targetElement)

    editedDataSegment.update(() => {
      return viewportData.data.slice(
        $selectionData.startOffset,
        $selectionData.endOffset + 1
      )
    })

    $editMode === EditByteModes.Single
      ? postEditorOnChangeMsg('hex')
      : postEditorOnChangeMsg()
  }

  function postEditorOnChangeMsg(forcedEncoding?: string) {
    vscode.postMessage({
      command: MessageCommand.editorOnChange,
      data: {
        fileOffset: $selectionData.startOffset + viewportData.fileOffset,
        selectionData: $editedDataSegment,
        encoding: forcedEncoding ? forcedEncoding : $editorEncoding,
        selectionSize: $selectionSize,
        editMode: $editMode,
      },
    })
  }

  $: {
    tick()
    if ($selectionData.active) {
      window.removeEventListener('keydown', navigation_keydown_event)
      if (viewportDataContainer)
        viewportDataContainer.removeEventListener(
          'wheel',
          navigation_wheel_event
        )
    } else {
      window.addEventListener('keydown', navigation_keydown_event)
      if (viewportDataContainer)
        viewportDataContainer.addEventListener('wheel', navigation_wheel_event)
    }
  }

  window.addEventListener('message', (msg) => {
    switch (msg.data.command) {
      case MessageCommand.viewportRefresh:
        if (awaitViewportScroll) {
          awaitViewportScroll = false
          lineTop = Math.max(0, Math.min(lineTopOnRefresh, lineTopMaxViewport))
        }
        break
    }
  })
</script>

<div class="container" style:height id={CONTAINER_ID}>
  {#each viewportLines as viewportLine}
    <div
      class={`line ${viewportLine.highlight}`}
      title={`file line #${viewportLine.fileLine}`}
    >
      <div class="address" id="address">
        <b>{viewportLine.offset}</b>
      </div>

      <div class="byte-line">
        {#each viewportLine.bytes as byte}
          <DataValue
            {byte}
            id={'physical'}
            selectedByte={$selectedByte}
            selectionData={$selectionData}
            radix={dataRadix}
            editMode={$editMode}
            disabled={byte.offset > viewportData.length}
            on:mouseup={mouseup}
            on:mousedown={mousedown}
          />
        {/each}
      </div>

      <div class="byte-line">
        {#each viewportLine.bytes as byte}
          <DataValue
            {byte}
            id={'logical'}
            selectedByte={$selectedByte}
            selectionData={$selectionData}
            radix={dataRadix}
            editMode={$editMode}
            disabled={byte.offset > viewportData.length}
            on:mouseup={mouseup}
            on:mousedown={mousedown}
          />
        {/each}
      </div>
    </div>
  {/each}
  <FlexContainer --dir="column">
    <FileTraversalIndicator
      totalLines={totalLinesPerFilesize}
      currentLine={lineTop}
      fileOffset={viewportData.fileOffset}
      {bytesPerRow}
    />
    <FlexContainer --dir="row">
      <Button
        fn={INCREMENT_LINE}
        disabledBy={atViewportTail && atFileTail}
        width="30pt"
      >
        <span slot="default" class="btn-icon material-symbols-outlined"
          >keyboard_arrow_down</span
        >
      </Button>
      <Button
        fn={INCREMENT_SEGMENT}
        disabledBy={atViewportTail && atFileTail}
        width="30pt"
      >
        <span slot="default" class="btn-icon material-symbols-outlined"
          >keyboard_double_arrow_down</span
        >
      </Button>
      <Button
        fn={SCROLL_TO_END}
        disabledBy={atViewportTail && atFileTail}
        width="30pt"
      >
        <span slot="default" class="btn-icon material-symbols-outlined"
          >stat_minus_3</span
        >
      </Button>
      <Button
        fn={DECREMENT_LINE}
        disabledBy={atViewportHead && atFileHead}
        width="30pt"
      >
        <span slot="default" class="btn-icon material-symbols-outlined"
          >keyboard_arrow_up</span
        >
      </Button>
      <Button
        fn={DECREMENT_SEGMENT}
        disabledBy={atViewportHead && atFileHead}
        width="30pt"
      >
        <span slot="default" class="btn-icon material-symbols-outlined"
          >keyboard_double_arrow_up</span
        >
      </Button>
      <Button
        fn={SCROLL_TO_TOP}
        disabledBy={atViewportHead && atFileHead}
        width="30pt"
      >
        <span slot="default" class="btn-icon material-symbols-outlined"
          >stat_3</span
        >
      </Button>
    </FlexContainer>
  </FlexContainer>
</div>

<style lang="scss">
  span {
    font-weight: bold;
  }
  div.container {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    font-size: 13px;
    font-family: var(--monospace-font);
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 3;
    grid-row-end: 4;
  }
  div.container div.line {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 24px;
  }
  div.container div.line div {
    display: flex;
    align-items: center;
  }
  div.container div.line.even {
    background-color: var(--color-primary-mid);
  }
  div.container div.line.odd {
    background-color: var(--color-primary-dark);
  }
  div.container div.line div.address {
    width: 110px;
    direction: rtl;
    justify-content: center;
    letter-spacing: 4px;
  }
  div.container .line .byte-line {
    background-color: var(--color-primary-dark);
    display: flex;
    flex-direction: row;
    // width: 100%;
    border-width: 0px 2px 0px 2px;
    border-color: var(--color-primary-mid);
    border-style: solid;
  }
  div.byte {
    width: 24px;
    height: 100%;
  }
  div.file-traversal-indicator {
    width: 100%;
    height: 100%;
    background-color: var(--color-secondary-dark);
  }
</style>
