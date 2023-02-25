import { Context } from "../Context"
import { Struct } from "./Struct"

export class StructRuntime {
    struct: Struct
    selfCtx: Context

    constructor (struct: Struct, selfCtx: Context) {
        if (struct == undefined) throw new Error("Passing in undefined Struct")
        this.struct = struct
        this.selfCtx = selfCtx
    }

    hasImplementedFunction(id: string) {
        return this.struct.getMethod(id) != undefined
    }

    getImplementedFunction(id: string) {
        return this.struct.getMethod(id)
    }

    inspect() {
        return `[Instanceof ${this.struct?.id}]`
    }
}