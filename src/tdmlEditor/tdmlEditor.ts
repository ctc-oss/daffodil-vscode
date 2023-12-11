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

import * as fs from 'fs'
import * as vscode from 'vscode'

// Function that will activate/open the tdml editor
export async function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tdml.edit', async () => {
      await createEditor(ctx)
    })
  )
}

// Class for creating TDMLEditor webview
class TDMLEditor {
  ctx: vscode.ExtensionContext
  panel: vscode.WebviewPanel | undefined = undefined
  extensionUri: vscode.Uri = vscode.Uri.parse('')

  constructor(ctx: vscode.ExtensionContext) {
    this.ctx = ctx

    if (vscode.workspace.workspaceFolders) {
      this.extensionUri = vscode.workspace.workspaceFolders[0].uri
    }
  }

  // Method to create/get the webview panel
  getPanel() {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        'tdmlEditor',
        'TDML Editor',
        vscode.ViewColumn.Active,
        this.getWebViewOptions(this.extensionUri)
      )

      this.panel.onDidDispose(
        () => {
          this.panel = undefined
        },
        null,
        this.ctx.subscriptions
      )
    }

    return this.panel
  }

  // Method for creating web view option that allow our custom script to run
  getWebViewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
    return {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.parse(this.ctx.asAbsolutePath('./src/tdmlEditor')),
      ],
    }
  }

  // Method to set html for the hex view
  getWebViewContent() {
    const scriptUri = vscode.Uri.parse(
      this.ctx.asAbsolutePath('./src/tdmlEditor/tdmlEditor.js')
    )
    const styleUri = vscode.Uri.parse(
      this.ctx.asAbsolutePath('./src/styles/styles.css')
    )
    const scriptData = fs.readFileSync(scriptUri.fsPath)
    const styleData = fs.readFileSync(styleUri.fsPath)

    const nonce = this.getNonce()

    return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width," initial-scale=1.0">
      <title>TDML Editor</title>
    </head>
    <body>
      <style>
        .container {
          display: block;
          position: relative;
          margin: 0px;
          margin-top: -10px;
          padding-left: 35px;
          margin-bottom: 25px;
          cursor: pointer;
          font-size: 14px;
          font-style: italic;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }      
        ${styleData}
      </style>
      <script nonce="${nonce}">
        ${scriptData}
      </script>

      <div>
        <div>
          <h1>TDML Test Cases</h1>
          <ul>
            <li><strong>TDML Test Case 1</strong> - Description for Test Case 1</li>
            <li><strong>TDML Test Case 2</strong> - Description for Test Case 2</li>
            <!-- Add more test cases as needed -->
          </ul>
        </div>

        <div>
          <input type="text" id="test-case-name" placeholder="Test Case Name"><br>
          <input type="text" id="test-case-description" placeholder="Test Case Description"> <br>
          <button onclick="appendTestCase()">Append Test Case</button>            
        </div>
      <div>

      <button style="margin-top: 10px" onclick="showRawView()">Raw View</button>
      <br/><br/>
      <button class="save-button" type="button" onclick="save()">Save</button>
    </body>
  </html>`
  }

  // Method to get nonce, helps with running custom script
  getNonce() {
    let text = ''
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }
}

// Function that will create webview
async function createEditor(ctx: vscode.ExtensionContext) {
  let tdmlEditor = new TDMLEditor(ctx)
  let panel = tdmlEditor.getPanel()
  panel.webview.html = tdmlEditor.getWebViewContent()

  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case 'toTS':
          console.log(message.data)
          panel.webview.postMessage({
            command: 'toJS',
            data: 'Inside of JS file',
          })
          return
      }
    },
    undefined,
    ctx.subscriptions
  )
}
