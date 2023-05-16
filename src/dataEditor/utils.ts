/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as vscode from 'vscode'
import * as fs from 'fs'
import {
  ALL_EVENTS,
  EditorClient,
  EventSubscriptionRequest,
  ViewportDataResponse,
  ViewportEvent,
  getClient,
  getLogger,
  getViewportData,
} from '@omega-edit/client'
import { EditorMessage, MessageCommand } from '../svelte/src/utilities/message'
import { EditByteModes } from '../svelte/src/stores/Configuration'
import * as net from 'net'
import { VIEWPORT_CAPACITY_MAX } from './dataEditorWebView'

let client: EditorClient
export async function initOmegaEditClient(
  port: number,
  host: string = '127.0.0.1'
) {
  client = getClient(port, host)
}

/**
 * Get the viewport data for a given viewport and send it to the editor
 * @param panel webview panel to send updates to
 * @param viewportId id of the viewport to get data for
 */
export async function sendViewportData(
  panel: vscode.WebviewPanel,
  viewportId: string
) {
  getViewportData(viewportId).then(
    async (viewportDataResponse: ViewportDataResponse) => {
      panel.webview.postMessage({
        command: MessageCommand.viewportRefresh,
        data: {
          viewportOffset: viewportDataResponse.getOffset(),
          viewportLength: viewportDataResponse.getLength(),
          viewportFollowingByteCount:
            viewportDataResponse.getFollowingByteCount(),
          viewportData: viewportDataResponse.getData_asU8(),
          viewportCapacity: VIEWPORT_CAPACITY_MAX,
        },
      })
    }
  )
}

/**
 * Subscribe to all events for a given viewport so the editor gets refreshed when changes to the viewport occur
 * @param panel webview panel to send updates to
 * @param viewportId id of the viewport to subscribe to
 */
export async function viewportSubscribe(
  panel: vscode.WebviewPanel,
  viewportId: string
) {
  // initial viewport population
  await sendViewportData(panel, viewportId)

  // subscribe to all viewport events
  client
    .subscribeToViewportEvents(
      new EventSubscriptionRequest().setId(viewportId).setInterest(ALL_EVENTS)
    )
    .on('data', async (event: ViewportEvent) => {
      getLogger().debug(
        `viewport '${event.getViewportId()}' received event: ${event.getViewportEventKind()}`
      )
      await sendViewportData(panel, viewportId)
    })
    .on('error', (err) => {
      // Call cancelled thrown sometimes when server is shutdown
      if (
        !err.message.includes('Call cancelled') &&
        !err.message.includes('UNAVAILABLE')
      )
        throw err
    })
}

export class DisplayState {
  public bytesPerRow: number
  public editorEncoding: BufferEncoding
  public colorThemeKind: vscode.ColorThemeKind
  private panel: vscode.WebviewPanel

  constructor(editorPanel: vscode.WebviewPanel) {
    this.bytesPerRow = 16
    this.editorEncoding = 'hex'
    this.colorThemeKind = vscode.window.activeColorTheme.kind
    this.panel = editorPanel

    vscode.window.onDidChangeActiveColorTheme((event) => {
      this.colorThemeKind = event.kind
      this.sendUIThemeUpdate()
    })
    this.sendUIThemeUpdate()
  }
  private sendUIThemeUpdate() {
    this.panel.webview.postMessage({
      command: MessageCommand.setUITheme,
      theme: this.colorThemeKind,
    })
  }
}

function latin1Undefined(c: string): boolean {
  const charCode = c.charCodeAt(0)
  return charCode < 32 || (charCode > 126 && charCode < 160)
}

export function logicalDisplay(
  bytes: ArrayBuffer,
  bytesPerRow: number
): string {
  const undefinedCharStandIn = 9617
  let result = ''
  if (bytes.byteLength > 0) {
    // TODO: How does this affect the simple editor?
    // replace newlines with spaces for the logical display
    const data = Buffer.from(bytes).toString('latin1').replace('\n', ' ')
    let i = 0
    while (true) {
      for (let col = 0; i < data.length && col < bytesPerRow; ++col) {
        const c = data.charAt(i++)
        result +=
          (latin1Undefined(c) ? String.fromCharCode(undefinedCharStandIn) : c) +
          ' '
      }
      result = result.slice(0, result.length - 1)
      if (i === data.length) {
        break
      }
      result += '\n'
    }
  }
  return result
}

export function fillRequestData(message: EditorMessage): [Buffer, string] {
  let selectionByteData: Buffer
  let selectionByteDisplay: string
  if (message.data.editMode === EditByteModes.Multiple) {
    selectionByteData = encodedStrToData(
      message.data.editedContent,
      message.data.encoding
    )
    selectionByteDisplay = dataToEncodedStr(
      selectionByteData,
      message.data.encoding
    )
  } else {
    selectionByteData =
      message.data.viewport === 'logical'
        ? encodedStrToData(message.data.editedContent, 'latin1')
        : radixStrToData(message.data.editedContent, message.data.radix)

    selectionByteDisplay =
      message.data.viewport === 'logical'
        ? message.data.editedContent
        : dataToRadixStr(selectionByteData, message.data.radix)
  }

  return [selectionByteData, selectionByteDisplay]
}
export function radixStrToData(
  selectionEdits: string,
  selectionRadix: number
): Buffer {
  return Buffer.from([parseInt(selectionEdits, selectionRadix)])
}

export function encodedStrToData(
  selectionEdits: string,
  selectionEncoding?: BufferEncoding
): Buffer {
  let selectionByteData: Buffer
  switch (selectionEncoding) {
    case 'hex':
      selectionByteData = Buffer.alloc(selectionEdits.length / 2)
      for (let i = 0; i < selectionEdits.length; i += 2) {
        selectionByteData[i / 2] = parseInt(selectionEdits.slice(i, i + 2), 16)
      }
      return selectionByteData
    case 'binary':
      selectionByteData = Buffer.alloc(selectionEdits.length / 8)
      for (let i = 0; i < selectionEdits.length; i += 8) {
        selectionByteData[i / 8] = parseInt(selectionEdits.slice(i, i + 8), 2)
      }
      return selectionByteData
    default:
      return Buffer.from(selectionEdits, selectionEncoding)
  }
}

export function dataToEncodedStr(
  buffer: Buffer,
  encoding: BufferEncoding
): string {
  return encoding === 'binary'
    ? dataToRadixStr(buffer, 2)
    : buffer.toString(encoding)
}

export function dataToRadixStr(buffer: Buffer, radix: number): string {
  const padLen = radixBytePad(radix)
  let ret = ''
  for (let i = 0; i < buffer.byteLength; i++) {
    ret += buffer[i].toString(radix).padStart(padLen, '0')
  }
  return ret
}

export function radixBytePad(radix: number): number {
  switch (radix) {
    case 2:
      return 8
    case 8:
      return 3
    case 10:
      return 3
    case 16:
      return 2
  }
  return 0
}

/**
 * Checks if a server is listening on a given port and host
 * @param port port to check
 * @param host host to check
 * @returns true if a server is listening on the given port and host, false otherwise
 */
export function checkServerListening(
  port: number,
  host: string
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket: net.Socket = new net.Socket()
    socket.setTimeout(2000) // set a 2-second timeout for the connection attempt
    socket.on('connect', () => {
      socket.destroy() // close the connection once connected
      resolve(true) // server is listening
    })
    socket.on('timeout', () => {
      socket.destroy() // close the connection on timeout
      resolve(false) // server is not listening
    })
    socket.on('error', () => {
      resolve(false) // server is not listening or an error occurred
    })
    socket.connect(port, host)
  })
}

/**
 * Removes a directory and all of its contents
 * @param dirPath path to directory to remove
 */
export function removeDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = `${dirPath}/${file}`
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursively remove subdirectories
        removeDirectory(curPath)
      } else {
        // Delete file
        fs.unlinkSync(curPath)
      }
    })

    // Remove empty directory
    fs.rmdirSync(dirPath)
  }
}
