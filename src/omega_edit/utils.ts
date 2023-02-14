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
import {
  EventSubscriptionRequest,
  ViewportDataRequest,
} from 'omega-edit/omega_edit_pb'
import * as fs from 'fs'
import { ALL_EVENTS, getClient } from 'omega-edit/settings'
import * as omegaEditServer from 'omega-edit/server'
import { displayTerminalExitStatus, runScript } from '../utils'
import { EditorMessage, MessageCommand } from '../svelte/src/utilities/message'
import { EditorClient } from 'omega-edit/omega_edit_grpc_pb'
import { createHash } from 'crypto'

let client: EditorClient
export function initOmegaEditClient(
  host: string = '127.0.0.1',
  port: number = 9000
) {
  client = getClient(host, port.toString())
}

export interface ViewportReference {
  label: string
  vpid: string
  hash: string
}

export function randomId() {
  return Math.floor(Math.random() * (1000 + 1))
}

export async function getFilePath(
  sessionFile: string,
  overwrite: boolean,
  newFile: boolean
): Promise<string | undefined> {
  // Get file path for saved file
  let filePath: string | undefined

  if (overwrite) {
    filePath = sessionFile
  } else if (newFile) {
    let fileName = sessionFile.split('/')[sessionFile.split('/').length - 1]
    let path = sessionFile.replace(`/${fileName}`, '')
    let fileNameStart = fileName
      .split('.')
      .slice(0, fileName.split('.').length - 1)
      .join('')
    let fileNameEnd = fileName.split('.')[fileName.split('.').length - 1]
    filePath = `${path}/${fileNameStart}-${randomId().toString()}.${fileNameEnd}`
  } else {
    filePath = await vscode.window.showInputBox({
      placeHolder: 'Save session as:',
    })
  }

  return filePath
}

export async function setViewportDataForPanel(
  panel: vscode.WebviewPanel,
  vp: string,
  commandViewport: string
) {
  client.getViewportData(
    new ViewportDataRequest().setViewportId(vp),
    async (err, r) => {
      let data = r?.getData_asB64()
      if (data) {
        const bufferData = Buffer.from(data, 'base64')
        const updatedHash = await hashData(bufferData)
        panel.webview.postMessage({
          command: MessageCommand.viewportSubscribe,
          viewportLabel: commandViewport,
          viewportData: Uint8Array.from(bufferData),
          displayData: bufferData.toString('hex'),
          contentHash: updatedHash,
        })
      }
    }
  )
}

export async function viewportSubscribe(
  panel: vscode.WebviewPanel,
  vp1: string,
  vp2: string,
  commandViewport: string
) {
  let request = new EventSubscriptionRequest()
    .setId(vp1)
    .setInterest(ALL_EVENTS)

  client.subscribeToViewportEvents(request).on('data', async (ve) => {
    await setViewportDataForPanel(panel, vp2, commandViewport)
  })

  // data request not ran right away, so this ensures the views are populated
  await setViewportDataForPanel(panel, vp2, commandViewport)
}

export async function startOmegaEditServer(
  ctx: vscode.ExtensionContext,
  rootPath: string,
  omegaEditPackageVersion: string,
  port: number
): Promise<[vscode.Terminal, boolean]> {
  const [scriptName, scriptPath] = await omegaEditServer.setupServer(
    rootPath,
    omegaEditPackageVersion,
    ctx.asAbsolutePath('./node_modules/omega-edit')
  )

  const terminal = await runScript(
    scriptPath,
    scriptName,
    null,
    ['--port', port.toString()],
    {
      OMEGA_EDIT_SERVER_PORT: port.toString(),
    },
    '',
    false,
    port
  )

  displayTerminalExitStatus(terminal)

  return [terminal, true]
}

export async function hashData(
  viewportData: Buffer | Uint8Array
): Promise<string> {
  return new Promise<string>((res, err) => {
    res(createHash('md5').update(viewportData).digest('hex'))
  })
}

export async function hashViewport(vpid: string): Promise<string> {
  return new Promise<string>((res, err) => {
    client.getViewportData(
      new ViewportDataRequest().setViewportId(vpid),
      async (err, r) => {
        let data = r?.getData_asB64()
        if (data) {
          const bufferData = Buffer.from(data, 'base64')
          const updatedHash = await hashData(bufferData)
          res(updatedHash)
        }
      }
    )
  })
}

export async function hashCommitedSelection(
  vpid: string,
  fileOffset: number,
  selectionSize: number
): Promise<string> {
  return new Promise<string>((res, err) => {
    client.getViewportData(
      new ViewportDataRequest().setViewportId(vpid),
      async (err, r) => {
        let data = r?.getData_asU8()
        if (data) {
          const subData = data.subarray(fileOffset, fileOffset + selectionSize)
          const selectionDataHash = await hashData(subData)
          res(selectionDataHash)
        }
      }
    )
  })
}

export class DisplayState {
  public bytesPerRow: number
  public editorEncoding: BufferEncoding
  constructor() {
    this.bytesPerRow = 16
    this.editorEncoding = 'hex'
  }
}

export function fileExtensionType(filename: string): string {
  return filename.substring(filename.lastIndexOf('.'))
}

function latin1Undefined(c: string): boolean {
  const charCode = c.charCodeAt(0)
  return charCode < 32 || (charCode > 126 && charCode < 160)
}

export function logicalDisplay(
  bytes: ArrayBuffer,
  bytesPerRow: number
): string {
  const undefinedCharStandIn = '�'
  let result = ''
  if (bytes.byteLength > 0) {
    const data = Buffer.from(bytes).toString('latin1').replace('\n', ' ')
    let i = 0
    while (true) {
      for (let col = 0; i < data.length && col < bytesPerRow; ++col) {
        const c = data.charAt(i++)
        result += (latin1Undefined(c) ? undefinedCharStandIn : c) + ' '
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

type Mimes = {
  [key: string]: number[]
}

const mimeTypes = {
  PNG: [0x89, 0x50, 0x4e, 0x47],
  JPEG: [0xff, 0xd8, 0xff, 0xe0],
  PDF: [0x25, 0x50, 0x44, 0x46],
  HTML: [0x3c, 0x21, 0x44, 0x4f, 0x43],
  MP3: [0x49, 0x44, 0x33],
  MP4: [0x00, 0x00, 0x00, 0x18],
  ZIP: [0x50, 0x4b, 0x03, 0x04],
  CSV: [0xef, 0xbb, 0xbf],
  DOCX: [0x50, 0x4b, 0x03, 0x04],
  XLSX: [0x50, 0x4b, 0x03, 0x04],
} as Mimes

export async function checkMimeType(filename: string): Promise<string> {
  let bytes: Buffer
  const file = fs.openSync(filename, 'r')
  bytes = Buffer.alloc(5)
  fs.readSync(file, bytes, 0, 5, null)
  fs.close(file)

  for (const key in mimeTypes) {
    if (mimeTypes[key].toString() === bytes.toString()) {
      return key
    }
  }
  return filename.lastIndexOf('.') > 0
    ? filename.substring(filename.lastIndexOf('.'))
    : 'unknown/binary'
}

export function fillRequestData(message: EditorMessage): [Buffer, string] {
  let selectionByteData: Buffer
  let selectionByteDisplay: string
  if (message.data.editMode === 'full') {
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
  let selectionByteLength: number
  let selectionByteData: Buffer

  if (selectionEncoding === 'hex') {
    selectionByteLength = selectionEdits.length / 2
    selectionByteData = Buffer.alloc(selectionByteLength)
    for (let i = 0; i < selectionEdits.length; i += 2) {
      selectionByteData[i / 2] = parseInt(selectionEdits.slice(i, i + 2), 16)
    }
  } else if (selectionEncoding === 'binary') {
    selectionByteLength = selectionEdits.length / 8
    selectionByteData = Buffer.alloc(selectionByteLength)
    for (let i = 0; i < selectionEdits.length; i += 8) {
      selectionByteData[i / 8] = parseInt(selectionEdits.slice(i, i + 8), 2)
    }
  } else {
    selectionByteData = Buffer.from(selectionEdits, selectionEncoding)
  }
  return selectionByteData
}

export function dataToEncodedStr(
  buffer: Buffer,
  encoding: BufferEncoding
): string {
  let ret: string
  encoding === 'binary'
    ? (ret = dataToRadixStr(buffer, 2))
    : (ret = buffer.toString(encoding))
  return ret
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

export async function getOnDiskFileSize(path: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    fs.open(path, 'r', (err, fd) => {
      fs.fstat(fd, (err, stats) => {
        resolve(stats.size)
      })
    })
  })
}
