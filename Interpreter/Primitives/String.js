import { PrimitiveType } from "./PrimitiveType.js";

export class String extends PrimitiveType {
    constructor(value) {
        super()
        this.value = value
    }

    toString() {
        return `"${this.value}"`
    }

    Add(other) {
        if (!(other instanceof String)) throw new Error(`Operator add cannot be used between String and ${other.constructor.name}`)
        return new String(this.value + other.value)
    }

    EE(other) {
        if (!(other instanceof String)) return new Boolean(false);
        return new Boolean(this.value == other.value)
    }
    
    NE(other) {
        if (!(other instanceof String)) return new Boolean(true);
        return new Boolean(this.value != other.value)
    }
}