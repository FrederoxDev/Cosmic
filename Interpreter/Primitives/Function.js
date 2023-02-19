import { PrimitiveType } from "./PrimitiveType.js";
import { String } from "./String.js"
import { Boolean } from "./Boolean.js";

export class Function extends PrimitiveType {
    constructor (identifier, args, body) {
        super()
        this.identifier = identifier
        this.args = args
        this.body = body
    }

    toString() {
        return new String(`[Function ${this.identifier}]`)
    }

    inspect() {
        return `[Function ${this.identifier}]`
    }
}