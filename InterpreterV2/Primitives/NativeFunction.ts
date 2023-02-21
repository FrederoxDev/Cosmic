import { Context } from "../Context"
import { Interpreter } from "../Interpreter"

export class NativeFunction {
    id: string
    onCall: (interpreter: Interpreter, ctx: Context, ...args: any[]) => any

    constructor (id: string, onCall: (interpreter: Interpreter, ctx: Context, ...args: any[]) => any) {
        this.id = id
        this.onCall = onCall
    }

    inspect() {
        return `[NativeFunction ${this.id}]`
    }
}