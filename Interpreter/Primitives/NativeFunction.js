import { PrimitiveType } from "./PrimitiveType.js";
import { String } from "./String.js";

export class NativeFunction extends PrimitiveType {
    constructor (identifier, onCall) {
        super()
        this.identifier = identifier
        this.onCall = onCall
    }

    toString() {
        return new String(`[NativeFunction ${this.identifier}]`)
    }

    inspect() {
        return `[NativeFunction ${this.identifier}]`
    }
}