import { BlockStatement, StatementCommon, VariableDeclaration } from "./Parser";

export type Variable = { id: string, type: string }

export class Scope {
    start: number
    end: number
    children: Scope[];
    variables: Variable[]

    constructor (start: number, end: number) {
        this.start = start
        this.end = end
        this.children = []
        this.variables = []
    }
}

/**
 * Analyses code for type's which can be used for intellisense
 */
export class StaticAnalysis {
    ast: StatementCommon;

    constructor (ast: StatementCommon) {
        this.ast = ast;
    }

    public getCurrentScope(index: number) {
        // TODO: FIND THE SPECIFIC SCOPE DO NOT RETURN THE GLOBAL SCOPE!
        return this.traverse(this.ast, new Scope(this.ast.start, this.ast.end));
    }

    private traverse(node: StatementCommon, scope: Scope): Scope {
        const types: { type: string, func: Function }[] = [
            { type: "BlockStatement", func: this.blockStatement },
            { type: "VariableDeclaration", func: this.variableDeclaration }
        ]

        const type = types.find(type => type.type == node.type);
        if (type == undefined) {
            console.log(`StaticAnalyser does not support '${node.type}'`);
            return scope;
        }

        return type.func.bind(this)(node, scope);
    }

    private blockStatement(node: BlockStatement, scope: Scope) {
        for (var i = 0; i < node.body.length; i++) {
            scope = this.traverse(node.body[i], scope);
        }
        return scope;
    }

    private variableDeclaration(node: VariableDeclaration, scope: Scope) {
        console.log(node.id, node.init.type);

        scope.variables.push({
            id: node.id,
            type: node.init.type
        })

        return scope;
    }
}