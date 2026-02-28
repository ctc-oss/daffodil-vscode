import { VSExtensionMessagePackage, VSMessagePackage } from 'ext_types'
import * as vscode from 'vscode'

function showMessage(pkg: VSExtensionMessagePackage<'showMessage'>) {
  const { message, level } = pkg.payload
  switch (level) {
    case 'error':
      vscode.window.showErrorMessage(message)
      break
    case 'info':
      vscode.window.showInformationMessage(message)
      break
    case 'warn':
      vscode.window.showWarningMessage(message)
      break
  }
}

export function handleExtensionMessage(pkg: VSMessagePackage) {}
