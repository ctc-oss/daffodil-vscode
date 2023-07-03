<script lang="ts">
  import {
    displayRadix,
    dvInt16,
    editMode,
    editedDataSegment,
    editorEncoding,
    focusedViewportId,
    selectionData,
    selectionSize,
  } from '../../../stores'
  import { createEventDispatcher, onMount, tick } from 'svelte'
  import {
    byte_value_string,
    selectedByte,
    type ByteValue,
    type ViewportData_t,
    null_byte,
    type ByteSelectionEvent,
    update_byte_action_offsets,
    BYTE_VALUE_DIV_OFFSET,
    viewport,
  } from './BinaryData'
  import { fileMetrics } from '../../Header/fieldsets/FileMetrics'
  import {
    EditByteModes,
    type RadixValues,
  } from '../../../stores/configuration'
  import DataValue from './DataValue.svelte'
  import { vscode } from '../../../utilities/vscode'
  import { MessageCommand } from '../../../utilities/message'
  import Button from '../../Inputs/Buttons/Button.svelte'
  import FlexContainer from '../../layouts/FlexContainer.svelte'
  import FileTraversalIndicator from './FileTraversalIndicator.svelte'

  export let lineTop = 0
  export let bytesPerRow = 16
  export let radix: RadixValues = 16
  export let viewportData: ViewportData_t

  const NUM_LINES_DISPLAYED = 20
  const DEBOUNCE_TIMEOUT_MS = 20
  const CONTAINER_ID = 'viewportData-container'
  function OFFSET_FETCH_ADJUSTMENT(direction: ViewportScrollDirection) {
    if (direction === ViewportScrollDirection.INCREMENT) {
      const validBytesRemaining = viewportData.bytesLeft > 512
      if (validBytesRemaining) return 512
      else {
        return viewportData.fileOffset + viewportData.bytesLeft
      }
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
    vscode.postMessage({
      command: MessageCommand.scrollViewport,
      data: {
        scrollOffset:
          $fileMetrics.computedSize - NUM_LINES_DISPLAYED * bytesPerRow,
        bytesPerRow: bytesPerRow,
      },
    })
    lineTopOnRefresh = 0
    awaitViewportScroll = true
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
  const LINE_IN_FILE = () => {
    return lineTop + viewportData.fileOffset / bytesPerRow
  }
  const LINE_FROM_BYTE_OFFSET = (offset: number) => {}

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
    lineTopMaxFile = totalLinesPerFilesize - NUM_LINES_DISPLAYED
    lineTopMaxViewport = totalLinesPerViewport - NUM_LINES_DISPLAYED
    viewportFileSegment = viewportData.fileOffset / viewportData.length + 1

    atViewportHead = lineTop === 0
    atViewportTail = lineTop === lineTopMaxViewport
    atFileHead = viewportData.fileOffset === 0
    atFileTail = viewportData.bytesLeft === 0
  }

  $: {
    if (viewportData.fileOffset >= 0 && !awaitViewportScroll)
      viewportLines = generate_line_data(lineTop)
  }

  function generate_line_data(
    startIndex: number,
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
              ? byte_value_string(viewportData.data[byteOffset], radix)
              : '',
        })
      }

      ret.push({
        offset: fileOffset.toString(radix).padStart(8, '0'),
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
    let linesToMove
    if (key === 'PageDown' || key === 'ArrowDown')
      linesToMove = shiftKey ? NUM_LINES_DISPLAYED : 1
    else if (key === 'PageUp' || key === 'ArrowUp')
      linesToMove = shiftKey ? -NUM_LINES_DISPLAYED : -1
    else if (key === 'Home') linesToMove = -NUM_LINES_DISPLAYED
    else if (key === 'End')
      linesToMove = totalLinesPerFilesize - lineTop - NUM_LINES_DISPLAYED

    const direction: ViewportScrollDirection = Math.sign(linesToMove)
    if (linesToMove) handle_navigation(direction, linesToMove)
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

    if (at_fetch_boundary(direction)) {
      let offset = OFFSET_FETCH_ADJUSTMENT(direction)
      // ? viewportData.fileOffset - viewportData.length
      // : viewportData.fileOffset + viewportData.length

      vscode.postMessage({
        command: MessageCommand.scrollViewport,
        data: {
          scrollOffset: offset,
          bytesPerRow: bytesPerRow,
        },
      })
      awaitViewportScroll = true
      lineTopOnRefresh =
        direction === ViewportScrollDirection.DECREMENT
          ? totalLinesPerViewport / 2 + linesToMove
          : 12 + linesToMove

      return
    }

    const newLine = lineTop + linesToMove
    lineTop =
      newLine < 0
        ? 0
        : newLine > lineTopMaxViewport
        ? lineTopMaxViewport
        : newLine
  }

  function at_fetch_boundary(direction: ViewportScrollDirection): boolean {
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
          lineTop = lineTopOnRefresh
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

      <div
        class="byte-line"
        style:width={(bytesPerRow * BYTE_VALUE_DIV_OFFSET - 4).toString() +
          'px'}
      >
        {#each viewportLine.bytes as byte}
          <DataValue
            {byte}
            id={'physical'}
            selectedByte={$selectedByte}
            selectionData={$selectionData}
            radix={$displayRadix}
            editMode={$editMode}
            disabled={byte.offset > viewportData.length}
            on:mouseup={mouseup}
            on:mousedown={mousedown}
          />
        {/each}
      </div>

      <div
        class="byte-line"
        style:width={(bytesPerRow * BYTE_VALUE_DIV_OFFSET).toString() + 'px'}
      >
        {#each viewportLine.bytes as byte}
          <DataValue
            {byte}
            id={'logical'}
            selectedByte={$selectedByte}
            selectionData={$selectionData}
            radix={$displayRadix}
            editMode={$editMode}
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
    width: 80pt;
    direction: rtl;
    padding-right: 2px;
    letter-spacing: 4px;
  }
  div.container .line .byte-line {
    background-color: var(--color-primary-dark);
    display: flex;
    flex-direction: row;
    width: 100%;
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
