import { Struct } from "./Primitives/index.js"

export class Context {
    variables = {}
    parent = undefined

    constructor(parent) {
        this.variables = {}
        this.parent = parent ?? undefined
    }

    setVariable(id, value) {
        this.variables[id] = value
    }

    nativeStruct(id, fields, impls) {
        const struct = new Struct()
    }
}