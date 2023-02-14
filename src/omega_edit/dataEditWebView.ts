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
import { SvelteWebviewInitializer } from './svelteWebviewInitializer'
import {
  logicalDisplay,
  DisplayState,
  fillRequestData,
  dataToEncodedStr,
  viewportSubscribe,
  checkMimeType,
  encodedStrToData,
  ViewportReference,
  hashData,
  hashViewport,
  hashCommitedSelection,
  getOnDiskFileSize,
} from './utils'
import { EditorMessage, MessageCommand } from '../svelte/src/utilities/message'
import * as omegaEditSession from 'omega-edit/session'
import * as omegaEditViewport from 'omega-edit/viewport'
import * as omegaEditChange from 'omega-edit/change'
import { OmegaEdit } from './omega_edit'

const VIEWPORT_CAPACITY_MAX = 1048576 // Maximum viewport size in Ωedit is 1048576 (1024 * 1024)

export class DataEditWebView implements vscode.Disposable {
  public panel: vscode.WebviewPanel
  private svelteWebviewInitializer: SvelteWebviewInitializer
  private displayState = new DisplayState()
  private omegaViewports: Map<string, ViewportReference> = new Map()
  private currentOmegaViewport: ViewportReference
  private fileToEdit: string = ''
  private omegaSessionId = ''
  constructor(
    protected context: vscode.ExtensionContext,
    private view: string,
    title: string
  ) {
    this.panel = this.createPanel(title)
    this.panel.webview.onDidReceiveMessage(this.messageReceiver, this)

    this.svelteWebviewInitializer = new SvelteWebviewInitializer(context)
    this.svelteWebviewInitializer.initialize(this.view, this.panel.webview)
    this.currentOmegaViewport = {
      label: '',
      vpid: '',
      hash: '',
    }
  }

  dispose(): void {
    ;async () => {
      this.omegaViewports.forEach(async (vpo) => {
        await omegaEditViewport.destroyViewport(vpo.vpid)
      })
      await omegaEditSession.destroySession(this.omegaSessionId)
    }
    this.panel.dispose()
  }

  show(): void {
    this.panel.reveal()
  }

  setTitle(title: string): void {
    this.panel.title = title
  }

  public async initialize() {
    vscode.window
      .showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select',
        canSelectFiles: true,
        canSelectFolders: false,
      })
      .then(async (fileUri) => {
        if (fileUri && fileUri[0]) {
          this.fileToEdit = fileUri[0].fsPath
          this.sendDiskFileSize()
        }

        this.omegaSessionId = await omegaEditSession.createSession(
          this.fileToEdit,
          undefined
        )
        let currentVpid = await omegaEditViewport.createViewport(
          undefined,
          this.omegaSessionId,
          0,
          VIEWPORT_CAPACITY_MAX,
          false
        )
        this.setCurrentViewport(currentVpid, 'vpAll')
      })
  }

  private createPanel(title: string): vscode.WebviewPanel {
    const column =
      vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn
        ? vscode.window.activeTextEditor?.viewColumn
        : vscode.ViewColumn.Active
    return vscode.window.createWebviewPanel(this.view, title, column, {
      enableScripts: true,
      retainContextWhenHidden: true,
    })
  }

  private async sendDiskFileSize() {
    return this.panel.webview.postMessage({
      command: MessageCommand.fileInfo,
      data: {
        diskFileSize: await getOnDiskFileSize(this.fileToEdit),
      },
    })
  }

  private async sendChangesInfo() {
    this.panel.webview.postMessage({
      command: MessageCommand.fileInfo,
      data: {
        computedFilesize: await omegaEditSession.getComputedFileSize(
          this.omegaSessionId
        ),
        commitHash: await hashViewport(this.currentOmegaViewport.vpid),
        changeCount: await omegaEditChange.getChangeCount(this.omegaSessionId),
        undoCount: await omegaEditChange.getUndoCount(this.omegaSessionId),
      },
    })
  }

  // handle messages from the webview
  private async messageReceiver(message: EditorMessage) {
    switch (message.command) {
      case MessageCommand.updateLogicalDisplay:
        this.displayState.bytesPerRow = message.data.bytesPerRow
        const logicalDisplayText = logicalDisplay(
          message.data.viewportData,
          this.displayState.bytesPerRow
        )
        this.panel.webview.postMessage({
          command: MessageCommand.updateLogicalDisplay,
          data: {
            logicalDisplay: logicalDisplayText,
          },
        })
        break
      case MessageCommand.editorOnChange:
        this.displayState.editorEncoding = message.data.encoding

        if (message.data.selectionData.length > 0) {
          const bufSlice = Buffer.from(message.data.selectionData)
          this.panel.webview.postMessage({
            command: MessageCommand.editorOnChange,
            selectionHash: await hashCommitedSelection(
              this.currentOmegaViewport.vpid,
              message.data.fileOffset,
              bufSlice.byteLength
            ),
            display: dataToEncodedStr(
              bufSlice,
              this.displayState.editorEncoding
            ),
          })
        }

        break
      case MessageCommand.commit: {
        const fileOffset = message.data.selectionStart
        const data = message.data.selectionData
        const originalSelectionLen = message.data.selectionDataLen + 1

        const omegaEdit = new OmegaEdit(
          this.omegaSessionId,
          fileOffset,
          data,
          originalSelectionLen,
          this.panel
        )
        await omegaEdit.replace(
          this.omegaSessionId,
          fileOffset,
          originalSelectionLen,
          data
        )
        this.sendChangesInfo()
        break
      }
      case MessageCommand.undo:
        await omegaEditChange.undo(this.omegaSessionId)
        this.sendChangesInfo()
        break
      case MessageCommand.redo:
        await omegaEditChange.redo(this.omegaSessionId)
        this.sendChangesInfo()
        break
      case MessageCommand.clear:
        await omegaEditChange.clear(this.omegaSessionId)
        this.sendChangesInfo()
        break
      case MessageCommand.save:
        {
          const vpData = await omegaEditViewport.getViewportData(
            this.currentOmegaViewport.vpid
          )
          const omegaEdit = new OmegaEdit(
            this.omegaSessionId,
            vpData.getOffset(),
            vpData.getData() as string,
            vpData.getLength(),
            this.panel
          )
          vscode.window
            .showSaveDialog({
              title: 'Save Data Edit File',
              saveLabel: 'Save',
            })
            .then(async (uri) => {
              if (uri && uri.fsPath) {
                if (uri.path === this.fileToEdit) {
                  await omegaEdit.save(this.fileToEdit, true, false)
                  this.setCurrentViewport(
                    this.currentOmegaViewport.vpid,
                    'vpAll'
                  )
                } else {
                  await omegaEditSession.saveSession(
                    this.omegaSessionId,
                    uri.path,
                    true
                  )
                  vscode.window.showInformationMessage(
                    `Session saved to new file: ${uri.path}`
                  )
                }
              }
            })
        }
        break
      case MessageCommand.requestEditedData:
        {
          const [selectionData, selectionDisplay] = fillRequestData(message)
          const data = Uint8Array.from(selectionData)
          this.panel.webview.postMessage({
            command: MessageCommand.requestEditedData,
            data: data,
            dataDisplay: selectionDisplay,
            selectionEditHash: await hashData(selectionData),
            selectionCommitHash: await hashCommitedSelection(
              this.currentOmegaViewport.vpid,
              message.data.selectionToFileOffset,
              message.data.selectionSize
            ),
          })
        }
        break
      case MessageCommand.searchAndReplace:
        {
          const viewportData = await omegaEditViewport.getViewportData(
            this.currentOmegaViewport.vpid
          )
          const searchDataBytes = encodedStrToData(
            message.data.searchData,
            this.displayState.editorEncoding
          )
          const filesize = await omegaEditSession.getComputedFileSize(
            this.omegaSessionId
          )
          const caseInsensitive = message.data.caseInsensitive
          const omegaEdit = new OmegaEdit(
            this.omegaSessionId,
            viewportData.getOffset(),
            viewportData.getData() as string,
            filesize,
            this.panel
          )
          const replaceDataBytes = encodedStrToData(
            message.data.replaceData,
            this.displayState.editorEncoding
          )
          await omegaEdit.searchAndReplace(
            filesize,
            searchDataBytes,
            replaceDataBytes,
            caseInsensitive
          )
          this.sendChangesInfo()
        }
        break
      case MessageCommand.search:
        {
          const viewportData = await omegaEditViewport.getViewportData(
            this.currentOmegaViewport.vpid
          )
          const searchDataBytes = encodedStrToData(
            message.data.searchData,
            this.displayState.editorEncoding
          )
          const filesize = await omegaEditSession.getComputedFileSize(
            this.omegaSessionId
          )
          const caseInsensitive = message.data.caseInsensitive
          const omegaEdit = new OmegaEdit(
            this.omegaSessionId,
            viewportData.getOffset(),
            viewportData.getData() as string,
            filesize,
            this.panel
          )
          let searchResults = await omegaEdit.search(
            filesize,
            searchDataBytes,
            caseInsensitive
          )
          this.panel.webview.postMessage({
            command: MessageCommand.search,
            searchResults: searchResults,
          })
        }
        break
    }
  }

  private async setCurrentViewport(vpid: string, label: string) {
    viewportSubscribe(this.panel, vpid, vpid, label)

    const filesize = await omegaEditSession.getComputedFileSize(
      this.omegaSessionId
    )

    omegaEditViewport.getViewportData(vpid).then(async (resp) => {
      const data = resp.getData_asU8()
      const md5 = await hashData(data)
      this.currentOmegaViewport.vpid = vpid
      this.currentOmegaViewport.label = label
      this.currentOmegaViewport.hash = md5
      this.panel.webview.postMessage({
        command: MessageCommand.fileInfo,
        data: {
          filename: this.fileToEdit,
          computedFilesize: filesize,
          filetype: await checkMimeType(this.fileToEdit),
          diskHash: md5,
          commitHash: md5,
        },
      })
    })
  }
}
