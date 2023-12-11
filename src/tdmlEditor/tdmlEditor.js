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

// Retrieve vscode api - Doing this multiple times causes issues with the scripts
const vscode = acquireVsCodeApi()

// Function for saving the settings to a launch.json
function save() {
  vscode.postMessage({
    command: 'toTS',
    data: 'Inside of TS file',
  })
}

// Function that gets called by default to create and update the hex web view
;(function main() {
  // Listener for getting messages/data from the extension
  window.addEventListener('message', async (event) => {
    const message = event.data

    switch (message.command) {
      case 'toJS':
        console.log(message.data)
        break
    }
  })
})()
