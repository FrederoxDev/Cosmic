import { Context } from "../Context"
import { Interpreter } from "../Interpreter"

export class NativeFunction {
    id: string
    onCall: (interpreter: Interpreter, ctx: Context, ...args: any[]) => [any, Context]

    constructor (id: string, onCall: (interpreter: Interpreter, ctx: Context, ...args: any[]) => [any, Context]) {
        this.id = id
        this.onCall = onCall
    }

    inspect() {
        return `[NativeFunction ${this.id}]`
    }
}