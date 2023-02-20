export class NativeFunction {
    id: string
    onCall: () => any

    constructor (id: string, onCall: () => any) {
        this.id = id
        this.onCall = onCall
    }

    toString() {
        return new String(`[NativeFunction ${this.id}]`)
    }

    inspect() {
        return `[NativeFunction ${this.id}]`
    }
}