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

import {
  clear,
  CountKind,
  createSession,
  createViewport,
  destroySession,
  edit,
  getComputedFileSize,
  getCounts,
  getLogger,
  IOFlags,
  modifyViewport,
  notifyChangedViewports,
  pauseViewportEvents,
  redo,
  replaceSession,
  resumeViewportEvents,
  saveSession,
  SaveStatus,
  searchSession,
  undo,
} from '@omega-edit/client'
import path from 'path'
import * as vscode from 'vscode'
import { EditorMessage, MessageCommand } from '../svelte/src/utilities/message'
import {
  addActiveSession,
  checkpointPath,
  HEARTBEAT_INTERVAL_MS,
  heartbeatInfo,
  removeActiveSession,
} from './client'
import { SvelteWebviewInitializer } from './svelteWebviewInitializer'
import {
  dataToEncodedStr,
  DisplayState,
  encodedStrToData,
  fillRequestData,
  logicalDisplay,
  sendViewportData,
  viewportSubscribe,
} from './utils'
import assert from 'assert'

export const VIEWPORT_CAPACITY_MAX = 16 * 640 // 10240, Ωedit maximum viewport size is 1048576 (1024 * 1024)

export class DataEditorWebView implements vscode.Disposable {
  public panel: vscode.WebviewPanel
  private svelteWebviewInitializer: SvelteWebviewInitializer
  private displayState: DisplayState
  private currentViewportId: string
  private fileToEdit: string = ''
  private omegaSessionId = ''
  private contentType = ''
  private fileSize = 0
  private heartBeatIntervalId: NodeJS.Timer | undefined = undefined

  constructor(
    protected context: vscode.ExtensionContext,
    private view: string,
    title: string,
    fileToEdit: string = ''
  ) {
    this.panel = this.createPanel(title)
    this.panel.webview.onDidReceiveMessage(this.messageReceiver, this)
    this.svelteWebviewInitializer = new SvelteWebviewInitializer(context)
    this.svelteWebviewInitializer.initialize(this.view, this.panel.webview)
    this.currentViewportId = ''
    this.contentType = ''
    this.fileSize = 0
    this.fileToEdit = fileToEdit
    this.displayState = new DisplayState(this.panel)
  }

  async dispose(): Promise<void> {
    if (this.heartBeatIntervalId) {
      clearInterval(this.heartBeatIntervalId)
      this.heartBeatIntervalId = undefined
    }

    // destroy the session and remove it from the list of active sessions
    removeActiveSession(await destroySession(this.omegaSessionId))
    this.panel.dispose()
  }

  show(): void {
    this.panel.reveal()
  }

  public async initialize() {
    // start the server heartbeat
    this.sendHeartbeat().then(() => {
      this.heartBeatIntervalId = setInterval(async () => {
        await this.sendHeartbeat()
      }, HEARTBEAT_INTERVAL_MS)
    })

    if (this.fileToEdit !== '') {
      await this.setupDataEditor()
    } else {
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
            this.panel.title = path.basename(this.fileToEdit)
            await this.setupDataEditor()
          }
        })
    }
  }

  private async setupDataEditor() {
    assert(
      checkpointPath && checkpointPath.length > 0,
      'checkpointPath is not set'
    )
    await createSession(this.fileToEdit, undefined, checkpointPath)
      .then(async (resp) => {
        this.omegaSessionId = resp.getSessionId()
        this.contentType = resp.hasContentType()
          ? (resp.getContentType() as string)
          : 'unknown'
        this.fileSize = resp.hasFileSize() ? (resp.getFileSize() as number) : 0
        addActiveSession(this.omegaSessionId)
        await this.sendDiskFileSize()
        await this.sendChangesInfo()
      })
      .catch(() => {
        vscode.window.showErrorMessage(
          `Failed to create session for ${this.fileToEdit}`
        )
      })
    await createViewport(
      undefined,
      this.omegaSessionId,
      0,
      VIEWPORT_CAPACITY_MAX,
      false
    )
      .then(async (resp) => {
        this.currentViewportId = resp.getViewportId()
        viewportSubscribe(this.panel, this.currentViewportId).then(async () => {
          this.panel.webview.postMessage({
            command: MessageCommand.fileInfo,
            data: {
              fileName: this.fileToEdit,
              computedFileSize: await getComputedFileSize(this.omegaSessionId),
            },
          })
        })
      })
      .catch(() => {
        vscode.window.showErrorMessage(
          `Failed to create viewport for ${this.fileToEdit}`
        )
      })
  }

  private async sendDiskFileSize() {
    await this.panel.webview.postMessage({
      command: MessageCommand.fileInfo,
      data: {
        fileName: this.fileToEdit,
        diskFileSize: this.fileSize,
        type: this.contentType,
      },
    })
  }

  private async sendHeartbeat() {
    this.panel.webview.postMessage({
      command: MessageCommand.heartbeat,
      data: {
        omegaEditPort: heartbeatInfo.omegaEditPort,
        serverVersion: heartbeatInfo.serverVersion,
        serverLatency: heartbeatInfo.latency,
        serverCpuLoadAvg: heartbeatInfo.serverCpuLoadAverage,
        serverUsedMemory: heartbeatInfo.serverUsedMemory,
        serverUptime: heartbeatInfo.serverUptime,
        sessionCount: heartbeatInfo.sessionCount,
      },
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

  private async sendChangesInfo() {
    getCounts(this.omegaSessionId, [
      CountKind.COUNT_COMPUTED_FILE_SIZE,
      CountKind.COUNT_CHANGE_TRANSACTIONS,
      CountKind.COUNT_UNDO_TRANSACTIONS,
    ]).then((counts) => {
      let data = {
        fileName: this.fileToEdit,
        computedFileSize: 0,
        changeCount: 0,
        undoCount: 0,
      }
      counts.forEach((count) => {
        switch (count.getKind()) {
          case CountKind.COUNT_COMPUTED_FILE_SIZE:
            data.computedFileSize = count.getCount()
            break
          case CountKind.COUNT_CHANGE_TRANSACTIONS:
            data.changeCount = count.getCount()
            break
          case CountKind.COUNT_UNDO_TRANSACTIONS:
            data.undoCount = count.getCount()
            break
        }
      })
      this.panel.webview.postMessage({
        command: MessageCommand.fileInfo,
        data: data,
      })
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

      case MessageCommand.scrollViewport:
        await this.scrollViewport(
          this.currentViewportId,
          message.data.scrollOffset
        )
        break

      case MessageCommand.editorOnChange:
        if (message.data.saveEncoding)
          this.displayState.editorEncoding = message.data.encoding

        if (
          message.data.selectionData &&
          message.data.selectionData.length > 0
        ) {
          const bufSlice = Buffer.from(message.data.selectionData)
          this.panel.webview.postMessage({
            command: MessageCommand.editorOnChange,
            display: dataToEncodedStr(
              bufSlice,
              this.displayState.editorEncoding
            ),
          })
        }
        break

      case MessageCommand.commit:
        await edit(
          this.omegaSessionId,
          message.data.offset,
          message.data.originalSegment,
          message.data.editedSegment
        )
          .then(async () => {
            await this.sendChangesInfo()
          })
          .catch(() => {
            vscode.window.showErrorMessage('Failed to commit changes')
          })
        break

      case MessageCommand.undo:
        await undo(this.omegaSessionId)
          .then(async () => {
            await this.sendChangesInfo()
          })
          .catch(() => {
            vscode.window.showErrorMessage('Failed to undo changes')
          })
        break

      case MessageCommand.redo:
        await redo(this.omegaSessionId)
          .then(async () => {
            await this.sendChangesInfo()
          })
          .catch(() => {
            vscode.window.showErrorMessage('Failed to redo changes')
          })
        break

      case MessageCommand.clear:
        const confirmation = await vscode.window.showInformationMessage(
          'Are you sure you want to revert all changes?',
          { modal: true },
          'Yes',
          'No'
        )
        if (confirmation === 'Yes') {
          await clear(this.omegaSessionId)
            .then(async () => {
              await this.sendChangesInfo()
            })
            .catch(() => {
              vscode.window.showErrorMessage('Failed to revert all changes')
            })
        }
        break

      case MessageCommand.save:
        let saved = false
        saveSession(
          this.omegaSessionId,
          this.fileToEdit,
          IOFlags.IO_FLG_OVERWRITE
        )
          .then(async (saveResponse) => {
            if (saveResponse.getSaveStatus() === SaveStatus.MODIFIED) {
              // Query user to overwrite the modified file
              const confirmation = await vscode.window.showInformationMessage(
                'File has been modified since being opened overwrite the file anyway?',
                { modal: true },
                'Yes',
                'No'
              )
              if (confirmation === 'Yes') {
                saveSession(
                  this.omegaSessionId,
                  this.fileToEdit,
                  IOFlags.IO_FLG_FORCE_OVERWRITE
                )
                  .then(async (saveResponse2) => {
                    saved = saveResponse2.getSaveStatus() === SaveStatus.SUCCESS
                  })
                  .catch(() => {
                    vscode.window.showErrorMessage(
                      `Failed to save over: ${this.fileToEdit}`
                    )
                  })
              }
            } else {
              saved = saveResponse.getSaveStatus() === SaveStatus.SUCCESS
            }
          })
          .catch(() => {
            vscode.window.showErrorMessage(
              `Failed to save over: ${this.fileToEdit}`
            )
          })
        if (saved) {
          vscode.window.showInformationMessage(`Saved: ${this.fileToEdit}`)
          await this.sendChangesInfo()
          await this.sendDiskFileSize()
        }
        break

      case MessageCommand.saveAs:
        vscode.window
          .showSaveDialog({
            title: 'Save Session',
            saveLabel: 'Save',
          })
          .then(async (uri) => {
            if (uri && uri.fsPath) {
              saveSession(
                this.omegaSessionId,
                uri.path,
                IOFlags.IO_FLG_OVERWRITE
              )
                .then(async (saveResponse) => {
                  if (saveResponse.getSaveStatus() === SaveStatus.MODIFIED) {
                    // Query user to overwrite the modified file
                    const confirmation =
                      await vscode.window.showInformationMessage(
                        'File has been modified since being opened overwrite the file anyway?',
                        { modal: true },
                        'Yes',
                        'No'
                      )
                    if (confirmation === 'Yes') {
                      saveSession(
                        this.omegaSessionId,
                        uri.path,
                        IOFlags.IO_FLG_FORCE_OVERWRITE
                      )
                        .then(async () => {
                          vscode.window.showInformationMessage(
                            `Saved: ${uri.path}`
                          )
                          if (uri.path === this.fileToEdit) {
                            await this.sendChangesInfo()
                            await this.sendDiskFileSize()
                          }
                        })
                        .catch(() => {
                          vscode.window.showErrorMessage(
                            `Failed to save over: ${uri.path}`
                          )
                        })
                    } else {
                      vscode.window.showInformationMessage(
                        `Save cancelled: ${uri.path}`
                      )
                    }
                  } else {
                    const fp = saveResponse.getFilePath()
                    vscode.window.showInformationMessage(`Saved: ${fp}`)
                    if (fp === this.fileToEdit) {
                      await this.sendChangesInfo()
                      await this.sendDiskFileSize()
                    }
                  }
                })
                .catch(() => {
                  vscode.window.showErrorMessage(`Failed to save: ${uri.path}`)
                })
            }
          })
        break

      case MessageCommand.requestEditedData:
        {
          const [selectionData, selectionDisplay] = fillRequestData(message)

          this.panel.webview.postMessage({
            command: MessageCommand.requestEditedData,
            data: {
              data: Uint8Array.from(selectionData),
              dataDisplay: selectionDisplay,
            },
          })
        }
        break

      case MessageCommand.searchAndReplace:
        {
          const searchDataBytes = encodedStrToData(
            message.data.searchData,
            message.data.encoding
          )
          const replaceDataBytes = encodedStrToData(
            message.data.replaceData,
            message.data.encoding
          )
          getLogger().debug(
            `replacing '${message.data.searchData}' with '${message.data.replaceData}' using encoding ${message.data.encoding}`
          )
          // pause viewport events before search, then resume after search
          await pauseViewportEvents(this.omegaSessionId)
          replaceSession(
            this.omegaSessionId,
            searchDataBytes,
            replaceDataBytes,
            message.data.caseInsensitive,
            0,
            0,
            0
          )
            .catch((err) => {
              vscode.window.showErrorMessage(err)
            })
            .then(async (replacementsCount) => {
              await resumeViewportEvents(this.omegaSessionId)
              try {
                await notifyChangedViewports(this.omegaSessionId)
              } catch (err) {
                // notifyChangedViewports failed, so manually update the viewport
                await sendViewportData(this.panel, this.currentViewportId)
              }
              this.panel.webview.postMessage({
                command: MessageCommand.replaceResults,
                data: {
                  replacementsCount: replacementsCount,
                },
              })
              await this.sendChangesInfo()
            })
        }
        break

      case MessageCommand.search:
        {
          const searchDataBytes = encodedStrToData(
            message.data.searchData,
            message.data.encoding
          )
          getLogger().debug(
            `searching for '${message.data.searchData}' using encoding ${message.data.encoding}`
          )
          const searchResults = await searchSession(
            this.omegaSessionId,
            searchDataBytes,
            message.data.caseInsensitive,
            0,
            0,
            0
          )
          this.panel.webview.postMessage({
            command: MessageCommand.searchResults,
            data: {
              results: searchResults,
            },
          })
        }
        break
    }
  }

  private async scrollViewport(viewportId: string, startOffset: number) {
    modifyViewport(viewportId, startOffset, VIEWPORT_CAPACITY_MAX).catch(() => {
      vscode.window.showErrorMessage(
        `Failed to scroll viewport ${viewportId} to offset ${startOffset}`
      )
    })
  }
}
