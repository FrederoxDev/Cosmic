import { BlockStatement, FunctionParameter } from "../../Parser"

export class Function {
    id: string
    parameters: FunctionParameter[]
    body: BlockStatement

    constructor(id: string, parameters: FunctionParameter[], body: BlockStatement) {
        this.id = id
        this.parameters = parameters
        this.body = body
    }

    inspect() {
        return `[Function ${this.id}]`
    }
}