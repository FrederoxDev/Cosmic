import { Boolean } from "./Boolean.js";
import { PrimitiveType } from "./PrimitiveType.js";
import { String } from "./String.js";

export class Number extends PrimitiveType {
    constructor(value) {
        super()
        this.value = value
    }

    op_eq(other) {
        if (other instanceof Number && other.value == this.value) return true
        return false;
    }

    toString() {
        return new String(`${this.value}`)
    }

    inspect() {
        return this.value
    }

    Add(other) {
        if (!(other instanceof Number)) this.operandError("Add", other)
        return new Number(this.value + other.value)
    }

    Minus(other) {
        if (!(other instanceof Number)) this.operandError("Minus", other)
        return new Number(this.value - other.value)
    }

    Mul(other) {
        if (!(other instanceof Number)) this.operandError("Mul", other)
        return new Number(this.value * other.value)
    }

    Div(other) {
        if (!(other instanceof Number)) this.operandError("Div", other)
        if (other.value == 0) throw new Error("Cannot divide by 0!")
        return new Number(this.value / other.value)
    }

    Pow(other) {
        if (!(other instanceof Number)) this.operandError("Pow", other)
        return new Number(Math.pow(this.value, other.value))
    }

    Negative() {
        return new Number(this.value * -1)
    }

    EE(other) {
        if (!(other instanceof Number)) return new Boolean(false);
        return new Boolean(this.value == other.value)
    }

    NE(other) {
        if (!(other instanceof Number)) return new Boolean(false);
        return new Boolean(this.value != other.value)
    }

    GT(other) {
        if (!(other instanceof Number)) this.operandError("GT", other)
        return new Boolean(this.value > other.value)
    }

    GTE(other) {
        if (!(other instanceof Number)) this.operandError("GTE", other)
        return new Boolean(this.value >= other.value)
    }

    LT(other) {
        if (!(other instanceof Number)) this.operandError("LT", other)
        return new Boolean(this.value < other.value)
    }

    LTE(other) {
        if (!(other instanceof Number)) this.operandError("LTE", other)
        return new Boolean(this.value <= other.value)
    }
}