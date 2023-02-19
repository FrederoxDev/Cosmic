import { PrimitiveType } from "./PrimitiveType.js";

export class Struct extends PrimitiveType {
    constructor (id, fields) {
        super()
        this.id = id
        this.fields = fields
        this.implements = []
    }

    toString() {
        return new String(`[Struct ${this.id}]`)
    }

    inspect() {
        return `[Struct ${this.id}]`
    }

    implement(func) {
        this.implements.push(func)
    }
}