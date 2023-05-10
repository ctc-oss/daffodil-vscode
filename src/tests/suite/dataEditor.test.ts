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

import * as assert from 'assert'
import * as path from 'path'
import * as vscode from 'vscode'
import fs from 'fs'
import { DataEditWebView } from '../../dataEdit/dataEditWebView'
import { TEST_SCHEMA } from './common'
import { after, before } from 'mocha'
import {
  createSimpleFileLogger,
  getClientVersion,
  getServerVersion,
  setLogger,
  startServer,
  stopServerUsingPID,
} from '@omega-edit/client'
import {
  appDataPath,
  dataEditorCommand,
  omegaEditHost,
  serverStartTimeout,
} from '../../dataEdit/client'

const testPort = 9009 // use a different port than the default for testing to avoid conflicts with running servers
const logLevel = 'debug'

function getTestPidFile(serverPort: number) {
  return path.join(appDataPath, `test-serv-${serverPort}.pid`)
}

function generateTestLogbackConfigFile(
  logFile: string,
  logLevel: string
): string {
  const dirname = path.dirname(logFile)
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true })
  }
  logLevel = logLevel.toUpperCase()
  const logbackConfig = `<?xml version="1.0" encoding="UTF-8"?>\n
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.FileAppender">
        <file>${logFile}</file>
        <encoder>
            <pattern>[%date{ISO8601}] [%level] [%logger] [%marker] [%thread] - %msg MDC: {%mdc}%n</pattern>
        </encoder>
    </appender>
    <root level="${logLevel}">
        <appender-ref ref="FILE" />
    </root>
</configuration>
`
  const logbackConfigFile = path.join(
    appDataPath,
    `test-serv-${testPort}.logconf.xml`
  )
  fs.writeFileSync(logbackConfigFile, logbackConfig)
  return logbackConfigFile // Return the path to the logback config file
}

suite('Data Editor Test Suite', () => {
  test('data edit command exists', async () => {
    assert.strictEqual(
      (await vscode.commands.getCommands()).includes(dataEditorCommand),
      true
    )
  })

  suite('Editor Service', () => {
    const pidFile = getTestPidFile(testPort)
    const serverLogFile = path.join(appDataPath, `test-serv-${testPort}.log`)
    const logConfigFile = generateTestLogbackConfigFile(serverLogFile, logLevel)
    const logFile = path.join(appDataPath, `test-dataEditor-${testPort}.log`)
    setLogger(createSimpleFileLogger(logFile, logLevel))

    before(async () => {
      const serverPid = (await Promise.race([
        startServer(testPort, omegaEditHost, pidFile, logConfigFile),
        new Promise((resolve, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(
                  `Server startup timed out after ${serverStartTimeout} seconds`
                )
              ),
            serverStartTimeout * 1000
          )
        }),
      ])) as number | undefined
      if (serverPid === undefined || serverPid <= 0) {
        throw new Error('Server failed to start or PID is invalid')
      }
    })

    after(async () => {
      assert.strictEqual(fs.existsSync(pidFile), true)
      assert.strictEqual(
        await stopServerUsingPID(parseInt(fs.readFileSync(pidFile).toString())),
        true
      )
    })

    test('is running', async () => {
      // make sure the server is listening on the configured port
      const wait_port = require('wait-port')
      const result = await wait_port({
        host: omegaEditHost,
        port: testPort,
        output: 'silent',
      })
      assert.strictEqual(result.open, true)
      assert.strictEqual(fs.existsSync(logConfigFile), true)
      // make sure there is a pid file for the server
      assert.strictEqual(fs.existsSync(pidFile), true)
    })

    test('server and client versions match', async () => {
      const clientVersion = getClientVersion()
      const serverVersion = await getServerVersion()
      assert.strictEqual(serverVersion, clientVersion)
      assert.strictEqual(fs.existsSync(serverLogFile), true)
      assert.strictEqual(fs.existsSync(logFile), true)
    })
  })

  suite('Data Editor', () => {
    test('data editor opens', async () => {
      const dataEditWebView: DataEditWebView =
        await vscode.commands.executeCommand(dataEditorCommand, TEST_SCHEMA)
      assert.ok(dataEditWebView)
      assert.strictEqual(dataEditWebView.panel.active, true)
      assert.strictEqual(dataEditWebView.panel.title, 'Data Editor')
    })
  })
})
