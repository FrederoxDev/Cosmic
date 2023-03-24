import { Assign, BlockStatement, CallExpression, Identifier, IfStatement, MemberExpression, StatementCommon, StructMethodAccessor, VariableDeclaration, WhileStatement } from "./Parser";
import { Definition, typeDefinitions } from './Definitions';
import { DiagnosticSeverity, MarkedString, MarkupContent } from 'vscode-languageserver';

export type Variable = { id: string, types: VariableType[] };
export type VariableType = { id: string, startIdx: number }

export type Hoverable = {start: number, end: number, message: MarkedString}
export type AnalyserError = {start: number, end: number, message: string, severity: DiagnosticSeverity}

export class Scope {
    start: number
    end: number
    children: Scope[];
    variables: Variable[];

    constructor (start: number, end: number) {
        this.start = start
        this.end = end
        this.children = []
        this.variables = []
    }
}

const getVariableTypeAtPosition = (position: number, variable: Variable): VariableType => {
    const validTypes = variable.types.filter((type) => type.startIdx <= position);
    validTypes.sort((a, b) => b.startIdx - a.startIdx);
    return validTypes.find((type) => type.startIdx <= position)!;
}

/**
 * Analyses code for type's which can be used for intellisense
 */
export class StaticAnalysis {
    members: Definition[]
    useMember: boolean;
    hoverables: Hoverable[];
    errors: AnalyserError[];

    constructor () {
        this.useMember = false;
        this.members = []
        this.hoverables = []
        this.errors = []
    }

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
            { type: "VariableDeclaration", func: this.variableDeclaration },
            { type: "IncompleteMemberExpression", func: this.incompleteMemberExpression },
            { type: "IncompleteStructMethodAccessor", func: this.incompleteStructMethodAccessor },
            { type: "Identifier", func: this.identifier },
            { type: "Assign", func: this.assign },
            { type: "CallExpression", func: this.callExpression }
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
        const varType = this.findType(node.init, scope);

        scope.variables.push({
            id: node.id,
            types: [
                {
                    id: varType,
                    startIdx: node.start
                }
            ] 
        })

        this.hoverables.push({
            start: node.start,
            end: node.end,
            message: {
                language: "cosmic",
                value: `${node.id}: ${varType}`
            }
        })

        return scope;
    }

    private assign(node: Assign, scope: Scope) {
        if (node.left.type !== "Identifier") return scope;

        const index = scope.variables.findIndex(v => v.id === node.left.value)
        if (index === -1) {
            this.errors.push({
                start: node.start,
                end: node.end,
                message: `${node.left.value} does not exist in this scope`,
                severity: DiagnosticSeverity.Error
            })
            return scope;
        }

        const varType = this.findType(node.value, scope);

        scope.variables[index].types.push({
            id: varType,
            startIdx: node.start
        })

        this.hoverables.push({
            start: node.start,
            end: node.end,
            message: {
                language: "cosmic",
                value: `${node.left.value}: ${varType}`
            }
        })

        return scope;
    }

    private identifier(node: Identifier, scope: Scope) {
        const scopeType = scope.variables.find(variable => variable.id == node.value);
        const defType = typeDefinitions.find(def => def.id === node.value)

        // It is a variable in the scope
        if (scopeType !== undefined) {
            const type = getVariableTypeAtPosition(node.end, scopeType).id
            
            this.hoverables.push({
                start: node.start,
                end: node.end,
                message: {
                    language: "cosmic",
                    value: `${scopeType.id}: ${type}`
                }
            })
        }

        if (defType !== undefined) {
            if (defType.type === "Struct") this.hoverables.push({
                start: node.start,
                end: node.end,
                message: {
                    language: "cosmic",
                    value: `struct ${defType.id}`
                }
            })

            // TODO: Enums
        }

        return scope;
    }

    private callExpression(node: CallExpression, scope: Scope) {
        const returnType = this.findType(node, scope);
        
        this.hoverables.push({
            start: node.start,
            end: node.end,
            message: {
                language: "cosmic",
                value: `(method): ${returnType}`
            }
        })

        return scope;
    }

    private incompleteMemberExpression(node: any, scope: Scope) {
        const objectType = this.findType(node.object, scope);
        const defintions = typeDefinitions.find(def => def.id == objectType);
        this.useMember = true;

        if (defintions == undefined) return scope;

        if (defintions.type === "Struct") {
            this.members.push(...defintions.methods ?? []);
            this.members.push(...defintions.properties ?? [])
        }

        // TODO: Enums

        return scope
    }

    private incompleteStructMethodAccessor(node: any, scope: Scope) {
        const structType = this.findType(node.object, scope);
        if (structType === undefined) return scope;

        const defintions = typeDefinitions.find(def => def.id === structType);
        this.useMember = true;
        if (defintions === undefined) return scope;

        if (defintions.type === "Struct") {
            this.members.push(...defintions.staticMethods ?? [])
        }

        return scope
    }

    /* TYPE STUFF */
    private findType(node: StatementCommon, scope: Scope): string {
        const types: { type: string, func: Function }[] = [
            { type: "CallExpression", func: this.callExpressionType },
            { type: "StructMethodAccessor", func: this.structMethodAccessorType },
            { type: "Identifier", func: this.identifierType },
            { type: "MemberExpression", func: this.memberExpressionType },
            { type: "Number", func: this.numberType },
            { type: "String", func: this.stringType },
            { type: "Boolean", func: this.booleanType },
        ]

        const type = types.find(type => type.type == node.type);
        if (type == undefined) {
            console.log(`Type Analysis does not support '${node.type}'`);
            return "Unknown"
        }

        return type.func.bind(this)(node, scope);
    }

    private memberExpressionType(node: MemberExpression, scope: Scope): string {
        const objectType = this.findType(node.object, scope);
        const typeDef = typeDefinitions.find(type => type.id === objectType);
        if (typeDef === undefined) return "Unknown";

        if (typeDef.type === "Struct") {
            const propDef = typeDef.properties?.find(p => p.id === node.property.value);
            const methodDef = typeDef.methods?.find(m => m.id === node.property.value);

            if (propDef !== undefined) return propDef.type;
            if (methodDef !== undefined) return methodDef.returnType;
            return "Unknown";
        }

        console.log(`memberExpression does not support ${typeDef.type}`)
        return "Unknown";
    }

    private callExpressionType(node: CallExpression, scope: Scope): string {
        return this.findType(node.callee, scope);
    }

    private structMethodAccessorType(node: StructMethodAccessor, scope: Scope): string {
        const structType = this.findType(node.struct, scope);
        const typeDef = typeDefinitions.find(type => type.id === structType);
        if (typeDef === undefined) return "Unknown";

        if (typeDef.type === "Struct") {
            const methodDef = typeDef.staticMethods?.find(m => m.id === node.method.value);
            if (methodDef !== undefined) return methodDef.returnType;
            return "Unknown";
        }

        console.log(`structMethodAccessor does not support ${typeDef.type}`)
        return "Unknown";
    }

    private identifierType(node: Identifier, scope: Scope): string {
        const scopeType = scope.variables.find(variable => variable.id == node.value);
        const defType = typeDefinitions.find(def => def.id === node.value)

        if (scopeType !== undefined) return getVariableTypeAtPosition(node.start, scopeType).id;
        if (defType === undefined) return "Unknown";
        
        if (defType.type === "Method") {
            return defType.returnType
        }

        return "Unknown"
    }

    private numberType(node: any, scope: Scope): string {
        return "Number"
    }

    private stringType(node: any, scope: Scope): string {
        return "String"
    }

    private booleanType(node: any, scope: Scope): string {
        return "Boolean"
    }
}