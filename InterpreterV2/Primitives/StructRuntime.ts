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

    hasFunction(id: string) {
        return this.selfCtx.getVariable(id) != undefined
    }

    getFunction(id: string) {
        return this.selfCtx.getVariable(id);
    }

    inspect() {
        return `[Instanceof ${this.struct?.id}]`
    }
}