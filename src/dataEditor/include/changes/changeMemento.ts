export type ViewoprtState = {
    offset: number
    length: number
    bytesRemaining: number
    data: Uint8Array
    serial: number
}
export interface MementoOriginator {
    readonly id: string
    restore(state: ViewoprtState): void
}
export type MementoAttributes = {
    currentPos: number
    history: ViewoprtState[]
}
export interface MementoOperations {
    history(): MementoAttributes['history']
    undo(): void
    redo(): void
    save(): void
}
class SessionMemento{
    constructor(private state: ViewoprtState){}
    getState(){ return this.state }
}

class MementoMgr {
    private mementoHistoryMap = new Map<string, MementoAttributes>()
    store(originator: MementoOriginator, attr: ViewoprtState){
        if(!this.mementoHistoryMap.get(originator.id))
            throw ""
        const attrs = this.mementoHistoryMap.get(originator.id)!
        attrs.history.push(attr)
        attrs.currentPos = attrs.history.length -1
    }
    undo(originator: MementoOriginator): void{
        if(!this.mementoHistoryMap.get(originator.id))
            throw ""
        const attrs = this.mementoHistoryMap.get(originator.id)!
        attrs.currentPos = attrs.history.length -1
        originator.restore()
    }

}

export function 
