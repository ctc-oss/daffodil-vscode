import * as vscode from 'vscode'
import * as grpc from '@grpc/grpc-js'
import { EditorClient } from 'omega-edit/omega_edit_grpc_pb'
import {
  ChangeKind,
  ChangeRequest,
  ViewportDataRequest,
} from 'omega-edit/omega_edit_pb'
import { getVersion, newSession, newViewport } from './omegaUtils'
import * as hexy from 'hexy'

export function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand('omega.grpc', async () => {
      let panel = vscode.window.createWebviewPanel(
        'viewport',
        'Ω Edit gRPC',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      )

      let uri = '127.0.0.1:9000'
      panel.webview.html = getWebviewContent(uri)

      let c = new EditorClient(uri, grpc.credentials.createInsecure())
      let v = await getVersion(c)
      panel.webview.postMessage({ command: 'version', text: v })

      let s = await newSession(c, 'build.sbt')
      panel.webview.postMessage({ command: 'session', text: s.getId() })

      let vpin = await newViewport('input', c, s, 0, 1000)
      let vp1 = await newViewport('1', c, s, 0, 64)
      let vp2 = await newViewport('2', c, s, 64, 64)
      let vp3 = await newViewport('3', c, s, 128, 64)

      let vpdrin = new ViewportDataRequest()
      vpdrin.setViewportId(vpin.getId())
      c.getViewportData(vpdrin, (err, r) => {
        let data = r?.getData_asB64()
        if (data) {
          let txt = Buffer.from(data, 'base64').toString('binary')
          panel.webview.postMessage({ command: 'input', text: txt })
        }
      })

      c.subscribeToViewportEvents(vp1).on('data', () => {
        let vpdr1 = new ViewportDataRequest()
        vpdr1.setViewportId(vp1.getId())
        c.getViewportData(vpdr1, (err, r) => {
          let data = r?.getData_asB64()
          if (data) {
            let txt = Buffer.from(data, 'base64').toString('binary')
            panel.webview.postMessage({ command: 'viewport1', text: txt })

            let hxt = hexy.hexy(txt)
            panel.webview.postMessage({ command: 'hex1', text: hxt })
          }
        })
      })
      c.subscribeToViewportEvents(vp1).on('data', () => {
        let vpdr2 = new ViewportDataRequest()
        vpdr2.setViewportId(vp2.getId())
        c.getViewportData(vpdr2, (err, r) => {
          let data = r?.getData_asB64()
          if (data) {
            let txt = Buffer.from(data, 'base64').toString('binary')
            panel.webview.postMessage({ command: 'viewport2', text: txt })
          }
        })
      })
      c.subscribeToViewportEvents(vp1).on('data', () => {
        let vpdr3 = new ViewportDataRequest()
        vpdr3.setViewportId(vp3.getId())
        c.getViewportData(vpdr3, (err, r) => {
          let data = r?.getData_asB64()
          if (data) {
            let txt = Buffer.from(data, 'base64').toString('binary')
            panel.webview.postMessage({ command: 'viewport3', text: txt })

            let hxt = hexy.hexy(txt)
            panel.webview.postMessage({ command: 'hex2', text: hxt })
          }
        })
      })

      panel.webview.onDidReceiveMessage(
        (message) => {
          switch (message.command) {
            case 'send':
              let b64 = Buffer.from(message.text, 'binary').toString('base64')
              let change = new ChangeRequest()
              change.setSessionId(s.getId())
              change.setKind(ChangeKind.CHANGE_OVERWRITE)
              change.setData(b64)
              change.setOffset(0)
              change.setLength(1000)
              c.submitChange(change, (err, r) => {
                if (err) console.log(err)
                else console.log(r)
              })
          }
        },
        undefined,
        ctx.subscriptions
      )
    })
  )
}

function getWebviewContent(uri: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Omega gRPC</title>
  <style>
      .grid-container {
        display: grid;
        grid-gap: 2px 2px;
        grid-template-columns: auto auto auto;
        background-color: #2196F3;
        padding: 5px;
      }

      .grid-item {
        background-color: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(0, 0, 0, 0.8);
        padding: 2px;
        font-size: 12px;
        text-align: left;
        color: black;
        white-space: pre;
        font-family: monospace;
      }
  </style>
</head>
<body>
  <div id="server">${uri}</div>
  <div id="version">v?</div>
  <div id="session">?</div>
  <div class="grid-container">
      <div class="grid-item" id="viewport1">empty</div>
      <div class="grid-item" id="viewport2">empty</div>
      <div class="grid-item" id="viewport3">empty</div>
      <div class="grid-item" id="hex1"></div>
      <div class="grid-item"><textarea id="input" rows="10" cols="50" oninput="sendit(this.value)"></textarea></div>
      <div class="grid-item" id="hex2"></div>
  </div>
  <script>
      const vscode = acquireVsCodeApi();
      function sendit(value) {
          vscode.postMessage({
              command: 'send',
              text: value
          })
      }
      window.addEventListener('message', event => {
          const message = event.data;
          document.getElementById(message.command).innerHTML = message.text
      });
  </script>
</body>
</html>`
}
