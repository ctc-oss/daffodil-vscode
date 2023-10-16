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
import { getConfig, osCheck } from '../utils'
import { DFDLDebugger } from '../classes/dfdlDebugger'
import { VSCodeLaunchConfigArgs } from '../classes/vscode-launch'
import { DataEditorConfig } from '../classes/dataEditor'
import { parse as jsoncParse } from 'jsonc-parser'

const defaultConf = getConfig({
  name: 'Wizard Config',
  request: 'launch',
  type: 'dfdl',
})

// Function that will activate/open the launch config wizard
export async function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tdml.config', async () => {
      await createWizard(ctx)
    })
  )
}

// Function to get config values
function getConfigValues(data, configIndex) {
  if (data && configIndex !== -1) {
    let configs: Array<VSCodeLaunchConfigArgs> = data.configurations
    var currentConfig = configs[configIndex]

    // make sure config has needed items set, if not update it
    for (var key of Object.keys(defaultConf)) {
      if (!currentConfig.hasOwnProperty(key)) {
        currentConfig[key] = defaultConf[key]
      }
    }

    return currentConfig
  } else {
    return defaultConf
  }
}

/**
 * Function used for:
 *  Creating the launch.json with the desired config settings
 *  Updating the launch.json configs to have the desired config settings
 *  Updating an already avaiable config inside of launch.json
 */
async function createUpdateConfigFile(data, updateOrCreate) {
  let rootPath = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : vscode.Uri.parse('').fsPath

  if (!fs.existsSync(`${rootPath}/.vscode`)) {
    fs.mkdirSync(`${rootPath}/.vscode`)
  }

  const launchPath = osCheck(
    `/${rootPath}/.vscode/launch.json`,
    `${rootPath}/.vscode/launch.json`
  )

  // Create launch.json if it doesn't exist already
  if (!fs.existsSync(`${rootPath}/.vscode/launch.json`)) {
    fs.writeFileSync(`${rootPath}/.vscode/launch.json`, data)
    vscode.window.showTextDocument(vscode.Uri.parse(launchPath))
    return
  }

  let newConf = JSON.parse(data).configurations[0]
  let fileData = jsoncParse(
    fs.readFileSync(`${rootPath}/.vscode/launch.json`).toString()
  )

  if (updateOrCreate.toLowerCase() === 'create') {
    let alreadyExists = false

    fileData.configurations.forEach((element) => {
      if (element.name === newConf.name) {
        alreadyExists = true
      }
    })

    if (alreadyExists) {
      // Config wanted to create already exists in launch.json
      vscode.window.showWarningMessage(
        'The conf trying to be saved already exists in the launch.json'
      )
      return
    }

    // Add new config to launch.json
    fileData.configurations.push(newConf)
    fs.writeFileSync(
      `${rootPath}/.vscode/launch.json`,
      JSON.stringify(fileData, null, 4)
    )
  } else if (updateOrCreate.toLowerCase() === 'update') {
    // Update selected config in launch.json
    let configIndex = -1

    for (let i = 0; i < fileData.configurations.length; i++) {
      if (fileData.configurations[i].name === newConf.name) {
        configIndex = i
        break
      }
    }

    // Error handling to make sure a proper config specified
    if (configIndex !== -1) {
      fileData.configurations[configIndex] = newConf
      fs.writeFileSync(
        `${rootPath}/.vscode/launch.json`,
        JSON.stringify(fileData, null, 4)
      )
    } else {
      vscode.window.showErrorMessage('Invalid Config Selected!')
    }
  }

  vscode.window.showTextDocument(vscode.Uri.parse(launchPath))
}

// Function to update the config values in the webview panel
async function updateWebViewConfigValues(configIndex) {
  let rootPath = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : vscode.Uri.parse('').fsPath

  let fileData =
    configIndex === -1
      ? null
      : jsoncParse(
          fs.readFileSync(`${rootPath}/.vscode/launch.json`).toString()
        )

  return getConfigValues(fileData, configIndex)
}

// Function to create file picker for wizard
async function openFilePicker(
  description: string,
  selectFiles: boolean = true,
  selectFolders: boolean = true
) {
  let rootPath = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : vscode.Uri.file('').fsPath

  let chosenFile = await vscode.window
    .showOpenDialog({
      canSelectMany: true,
      openLabel: description,
      canSelectFiles: selectFiles,
      canSelectFolders: selectFolders,
      title: description,
    })
    .then(async (fileUri) => {
      return fileUri && fileUri[0] ? fileUri[0].fsPath : ''
    })

  if (chosenFile.includes(rootPath)) {
    let regExp = new RegExp(rootPath, 'g')
    chosenFile = chosenFile.replace(regExp, '${workspaceFolder}')
  }

  return chosenFile
}

// Function that will create webview
async function createWizard(ctx: vscode.ExtensionContext) {
  let tdmlWizard = new tdmlWizard(ctx)
  let panel = launchWizard.getPanel()
  panel.webview.html = launchWizard.getWebViewContent()

  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case 'saveConfig':
          await createUpdateConfigFile(message.data, message.updateOrCreate)
          panel.dispose()
          return
        case 'updateConfigValue':
          var configValues = await updateWebViewConfigValues(
            message.configIndex
          )
          panel.webview.postMessage({
            command: 'updateConfValues',
            configValues: configValues,
          })
          return
        case 'openFilePicker':
          let result = await openFilePicker(
            message.description,
            message.selectFiles,
            message.selectFolders
          )

          // don't add empty string to table
          if (result !== '') {
            // check for duplicate values
            let duplicateCount = 0

            if (message.id === 'daffodilDebugClasspath') {
              duplicateCount = message.extraData['daffodilDebugClasspath']
                .split(':')
                .some((cp) => cp === result)
            }

            var command =
              duplicateCount > 0
                ? `${message.id} Value has already been used`
                : `${message.id}Update`

            if (duplicateCount > 0) {
              vscode.window.showWarningMessage('Selected path already added')
            }

            panel.webview.postMessage({
              command: command,
              value: result,
            })
          }
          return
      }
    },
    undefined,
    ctx.subscriptions
  )
}

// Class for creating launch wizard webview
class LaunchWizard {
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
        'launchWizard',
        'Launch Config Wizard',
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
        vscode.Uri.parse(this.ctx.asAbsolutePath('./src/launchWizard')),
      ],
    }
  }

  // Method to set html for the hex view
  getWebViewContent() {
    const scriptUri = vscode.Uri.parse(
      this.ctx.asAbsolutePath('./src/launchWizard/launchWizard.js')
    )
    const styleUri = vscode.Uri.parse(
      this.ctx.asAbsolutePath('./src/styles/styles.css')
    )
    const scriptData = fs.readFileSync(scriptUri.fsPath)
    const styleData = fs.readFileSync(styleUri.fsPath)

    const nonce = this.getNonce()

    let rootPath = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : vscode.Uri.parse('').fsPath

    let configSelect = ''
    let newConfig = !fs.existsSync(`${rootPath}/.vscode/launch.json`)
    let configIndex = fs.existsSync(`${rootPath}/.vscode/launch.json`) ? 0 : -1
    let fileData = JSON.parse('{}')

    if (fs.existsSync(`${rootPath}/.vscode/launch.json`)) {
      fileData = jsoncParse(
        fs.readFileSync(`${rootPath}/.vscode/launch.json`).toString()
      )

      fileData.configurations.forEach((element) => {
        configSelect += `<option value="${element.name}">${element.name}</option>`
      })
    }

    let defaultValues = getConfigValues(fileData, configIndex)

    let nameVisOrHiddenStyle = newConfig
      ? 'margin-top: 10px; visibility: visible;'
      : 'visibility: hidden;'

    configSelect += `<option value="New Config">New Config</option>`

    let openHexView = defaultValues.openHexView ? 'checked' : ''
    let openInfosetDiffView = defaultValues.openInfosetDiffView ? 'checked' : ''
    let openInfosetView = defaultValues.openInfosetView ? 'checked' : ''
    let stopOnEntry = defaultValues.stopOnEntry ? 'checked' : ''
    let trace = defaultValues.trace ? 'checked' : ''
    let useExistingServer = defaultValues.useExistingServer ? 'checked' : ''

    let daffodilDebugClasspathList =
      '<ul id="daffodilDebugClasspathTable" style="list-style: none; padding-left: 20px;">'
    if (defaultValues.daffodilDebugClasspath) {
      let itemArray = defaultValues.daffodilDebugClasspath.split(':')
      for (let i = 0; i < itemArray.length; i++) {
        daffodilDebugClasspathList += `
          <li style="margin-left: -5px;" onclick="removeDebugClasspathItem(this)">
            <p id="debug-classpath-li-${itemArray[i]}" class="debug-classpath-item">
              <button id="remove-debug-classpath-li-${itemArray[i]}" class="minus-button" type="button">-</button>
              ${itemArray[i]}
            </p>
          </li>`
      }
    }
    daffodilDebugClasspathList += '</ul>'

    let infosetFormatSelect = ''
    let infosetFormatTypes = ['xml', 'json']
    let infosetFormat = defaultValues.infosetFormat

    infosetFormatTypes.forEach((type) => {
      if (type === infosetFormat) {
        infosetFormatSelect += `<option selected value="${type}">${type}</option>`
      } else {
        infosetFormatSelect += `<option value="${type}">${type}</option>`
      }
    })

    let infosetOutputTypeSelect = ''
    let infosetOutputTypes = ['none', 'console', 'file']
    let infosetOutputType = defaultValues.infosetOutput['type']
    let infosetOutputPath = defaultValues.infosetOutput['path']
    let infosetPathVisOrHiddenStyle =
      infosetOutputType === 'file'
        ? 'margin-top: 10px; visibility: visible;'
        : 'visibility: hidden;'

    infosetOutputTypes.forEach((type) => {
      if (type === infosetOutputType) {
        infosetOutputTypeSelect += `<option selected value="${type}">${type}</option>`
      } else {
        infosetOutputTypeSelect += `<option value="${type}">${type}</option>`
      }
    })

    let tdmlActionSelect = 'none'
    let tdmlActions = ['none', 'generate', 'append', 'execute']
    let tdmlAction =
      'tdmlConfig' in defaultValues ? defaultValues.tdmlConfig['action'] : null
    let tdmlName =
      'tdmlConfig' in defaultValues ? defaultValues.tdmlConfig['name'] : null
    let tdmlDescription =
      'tdmlConfig' in defaultValues
        ? defaultValues.tdmlConfig['description']
        : null
    let tdmlPath =
      'tdmlConfig' in defaultValues ? defaultValues.tdmlConfig['path'] : null

    // tdml items need 0 height and width when hidden so there is no large empty space
    let tdmlNameDesVisOrHiddenStyle =
      tdmlAction !== null
        ? 'margin-top: 10px; visibility: visible;'
        : 'width: 0px; height: 0px; visibility: hidden'
    let tdmlPathVisOrHiddenStyle =
      tdmlAction === 'generate'
        ? 'margin-top: 10px; visibility: visible;'
        : 'width: 0px; height: 0px; visibility: hidden'

    tdmlActions.forEach((action) => {
      if (action === tdmlAction) {
        tdmlActionSelect += `<option selected value="${action}">${action}</option>`
      } else {
        tdmlActionSelect += `<option value="${action}">${action}</option>`
      }
    })

    let dfdlDebugger: DFDLDebugger = defaultValues.dfdlDebugger
    let dataEditor: DataEditorConfig = defaultValues.dataEditor

    return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width," initial-scale=1.0">
      <title>Launch Config Wizard</title>
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

      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
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
<button onclick="showRawView()">Raw View</button> </div>
  </div>

      

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
