import assert from 'assert'
import { EditorCommand } from '../../core/editor/dataEditor'

export const editorCommands: Map<
  EditorCommand['command'],
  EditorCommand['initializer']
> = new Map()
export function RegisterCommand(command: EditorCommand): Promise<void> {
  return new Promise((res, rej) => {
    editorCommands.set(command.command, command.initializer)
    res()
  })
}
export async function RunCommand(c: string): Promise<void> {
  return new Promise(async (res, rej) => {
    const initializer = vscodeCommands.get(c)
    assert(initializer)
    await initializer!()
    res()
  })
}
export type CommandMap = Map<string, (...args: any[]) => any>
export const vscodeCommands: CommandMap = new Map()
