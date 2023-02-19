import { PrimitiveType } from "./PrimitiveType.js";

export class StructInstance extends PrimitiveType {
    constructor (structBase, selfCtx) {
        super()
        this.structBase = structBase
        this.selfCtx = selfCtx
    }

    toString() {
        return new String(`${this.structBase.id} {  }`)
    }

    inspect() {
        var out = ""

        this.structBase.fields.forEach(field => {
            const name = field[0].value
            const value = this.selfCtx.variables[name]

            out += `\n    ${name}: ${value.inspect()},`
        })

        return `${this.structBase.id} {${out}\n  }`
    }
}