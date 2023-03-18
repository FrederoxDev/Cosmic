import { BlockStatement, IfStatement, StatementCommon, VariableDeclaration, WhileStatement } from "./Parser";

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
    constructor () {}

    public getCurrentScope(index: number, scope: Scope) {
        // Filter all children out that are already not in the scope
        const filtered = scope.children.filter(child => index >= child.start && index <= child.end);

        // Get all children scopes to remove its children outside
        const filteredChildren = filtered.map(child => this.getCurrentScope(index, child));
        scope.children = filteredChildren;

        return scope;
    }

    public traverse(node: StatementCommon, scope: Scope): Scope {
        const types: { type: string, func: Function }[] = [
            { type: "BlockStatement", func: this.blockStatement },
            { type: "IfStatement", func: this.ifStatement },
            { type: "WhileStatement", func: this.whileStatement },
            { type: "VariableDeclaration", func: this.variableDeclaration }
        ]

        const type = types.find(type => type.type == node.type);
        if (type == undefined) {
            console.log(`StaticAnalyser does not support '${node.type}'`);
            return scope;
        }

        scope = type.func.bind(this)(node, scope);
        if (scope === undefined) {
            console.log(`${node.type} did not return the scope!`)
        }
        return scope;
    }

    private blockStatement(node: BlockStatement, scope: Scope) {
        for (var i = 0; i < node.body.length; i++) {
            scope = this.traverse(node.body[i], scope);
        }
        
        return scope;
    }

    private ifStatement(node: IfStatement, scope: Scope) {
        var consequent = new Scope(node.consequent.start, node.consequent.end);
        consequent = this.traverse(node.consequent, consequent);
        scope.children.push(consequent);

        if (node.elseConsequent !== null) {
            var elseConsequent = new Scope(node.elseConsequent.start, node.elseConsequent.end);
            elseConsequent = this.traverse(node.elseConsequent, elseConsequent);
            scope.children.push(elseConsequent)
        }

        return scope;
    }

    private whileStatement(node: WhileStatement, scope: Scope) {
        var consequent = new Scope(node.consequent.start, node.consequent.end);
        consequent = this.traverse(node.consequent, consequent);
        scope.children.push(consequent);

        return scope;
    }

    private variableDeclaration(node: VariableDeclaration, scope: Scope) {
        // TODO: Traverse node.init
        scope.variables.push({
            id: node.id,
            type: node.init.type
        })

        return scope;
    }
} 