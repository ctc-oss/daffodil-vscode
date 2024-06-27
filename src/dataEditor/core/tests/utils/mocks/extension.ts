export interface DisposeMe {
  dispose(): Promise<void>
}
export type CtxMock = {
  subscriptions: DisposeMe[]
}
export const CtxMock: CtxMock = { subscriptions: [] }

export type CommandFn = (...args: any[]) => any
export type Command = { name: string; callback: CommandFn }
export class CommandsMock {
  commands: Map<string, CommandFn> = new Map()
  register(command: string, callback: CommandFn, thisArg?: any) {}
  execute(command: string) {}
}
// export const CommandsMock: CommandsMock = []
