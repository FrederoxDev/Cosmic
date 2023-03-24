import { BlockStatement, FunctionParameter } from "../Parser";

export class CosmicFunction {
    id: string;
    parameters: FunctionParameter[];
    functionBody: BlockStatement;

    constructor(id: string, parameters: FunctionParameter[], functionBody: BlockStatement) {
        this.id = id;
        this.parameters = parameters;
        this.functionBody = functionBody;
    }
}