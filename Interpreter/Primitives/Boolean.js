import { PrimitiveType } from "./PrimitiveType.js";
import { String } from "./String.js";

export class Boolean extends PrimitiveType {
    constructor(value) {
        super()
        this.value = value
    }

    Not() {
        return new Boolean(!this.value)
    }

    And(other) {
        if (!(other instanceof Boolean)) this.operandError("And", other)
        return new Boolean(this.value && other.value)
    }

    Or(other) {
        if (!(other instanceof Boolean)) this.operandError("Or", other)
        return new Boolean(this.value || other.value)
    }

    EE(other) {
        if (!(other instanceof Boolean)) return new Boolean(false);
        return new Boolean(this.value == other.value)
    }

    NE(other) {
        if (!(other instanceof Boolean)) return new Boolean(true);
        return new Boolean(this.value != other.value)
    }

    toString() {
        return new String(this.value ? "true" : "false")
    }

    inspect() {
        return this.value
    }
}