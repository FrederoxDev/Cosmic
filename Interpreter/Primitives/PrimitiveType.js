export class PrimitiveType {
    operationNotImpl(opName) {
        var err = new Error(`${this.constructor.name} does not implement operation '${opName}'`)
        err.stack = ""
        err.name = "Runtime"
        throw err;
    }

    operandError(operator, other) {
        var err = new Error(`Operator ${operator} cannot be used between ${this.constructor.name} and ${other.constructor.name}`)
        err.stack = ""
        err.name = "Runtime"
        throw err
    }

    toString() {
        return `[PrimitiveType]`
    }

    /* Arithmetic Operations */
    Add(other) { this.operationNotImpl("Add") }
    Minus(other) { this.operationNotImpl("Minus") }
    Mul(other) { this.operationNotImpl("Mul") }
    Div(other) { this.operationNotImpl("Div") }
    Pow(other) { this.operationNotImpl("Pow") }

    /* Unary Operations */
    Negative() { this.operationNotImpl("Negative") }
    Not() { this.operationNotImpl("Not") }

    /* Logical Expressions */
    And(other) { this.operationNotImpl("And") }
    Or(other) { this.operationNotImpl("Or") }

    /* Comparison Expressions */
    EE(other) { this.operationNotImpl("EE") }
    NE(other) { this.operationNotImpl("NE") }
    GT(other) { this.operationNotImpl("GT") }
    GTE(other) { this.operationNotImpl("GTE") }
    LT(other) { this.operationNotImpl("LT") }
    LTE(other) { this.operationNotImpl("LTE") }
}