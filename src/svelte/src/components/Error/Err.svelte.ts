const ErrorSymbolCharCode = String.fromCharCode(9888)

export const enum ErrorComponentType {
    SYMBOL,
    STRING,
}

export class ErrorState {
    private errMsgState = ''

    constructor(readonly type: ErrorComponentType) { }

    update(msg: string) {
        this.errMsgState = msg
    }

    errorExists(): boolean {
        return this.errMsgState.length > 0
    }

    clear() {
        this.errMsgState = ''
    }
    innerHTML(): string {
        return this.type === ErrorComponentType.STRING
            ? this.errMsgState
            : ErrorSymbolCharCode
    }

    readonly message = () => this.errMsgState
}
