import { BlockStatement, CallExpression, Identifier, IfStatement, MemberExpression, StatementCommon, StructMethodAccessor, VariableDeclaration, WhileStatement } from "./Parser";

export type TypeDefinition = { id: string }
export type Variable = { id: string, type: string };
export type MemberProperty = { id: string, type: string };
export type MemberMethod = { id: string, returns: string };
export type MemberStaticMethod = { id: string, returns: string };

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

/**
 * Analyses code for type's which can be used for intellisense
 */
export class StaticAnalysis {
    memberProperties: MemberProperty[];
    memberMethods: MemberMethod[];
    memberStaticMethods: MemberStaticMethod[];
    useMember: boolean;

    constructor () {
        this.useMember = false;
        this.memberProperties = []
        this.memberMethods = []
        this.memberStaticMethods = []
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
            type: varType.id
        })

        return scope;
    }

    private incompleteMemberExpression(node: any, scope: Scope) {
        const objectType = this.findType(node.object, scope).id;
        const defintions = typeDefinitions.find(def => def.id == objectType);
        this.useMember = true;

        if (defintions == undefined) return scope;

        if (defintions.properties)
            this.memberProperties.push(...defintions.properties)

        if (defintions.methods)
            this.memberMethods.push(...defintions.methods)

        return scope
    }

    private incompleteStructMethodAccessor(node: any, scope: Scope) {
        const structType = this.findType(node.object, scope);
        if (structType === undefined) return scope;

        const defintions = typeDefinitions.find(def => def.id === structType.id);
        this.useMember = true;
        if (defintions === undefined) return scope;

        if (defintions.staticMethods)
            this.memberStaticMethods.push(...defintions.staticMethods)

        return scope
    }

    /* TYPE STUFF */
    private findType(node: StatementCommon, scope: Scope): TypeDefinition {
        const types: { type: string, func: Function }[] = [
            { type: "CallExpression", func: this.callExpression },
            { type: "StructMethodAccessor", func: this.structMethodAccessor },
            { type: "Identifier", func: this.identifier },
            { type: "MemberExpression", func: this.memberExpression },
            { type: "Number", func: this.number }
        ]

        const type = types.find(type => type.type == node.type);
        if (type == undefined) {
            console.log(`StaticAnalyser does not evaulating type of '${node.type}'`);
            return { id: "Unknown" }
        }

        const typeDef = type.func.bind(this)(node, scope);
        return typeDef;
    }

    private memberExpression(node: MemberExpression, scope: Scope): TypeDefinition {
        const objectType = this.findType(node.object, scope).id;
        const typeDef = typeDefinitions.find(type => type.id === objectType);
        if (typeDef === undefined) return { id: "Unknown" };

        const propertyDef = typeDef.properties?.find(prop => prop.id === node.property.value);
        const methodDef = typeDef.methods?.find(method => method.id === node.property.value);

        if (propertyDef !== undefined) {
            return { id: propertyDef.type }
        }

        if (methodDef !== undefined) {
            return { id: methodDef.returns }
        }

        return { id: "Unknown" }
    }

    private callExpression(node: CallExpression, scope: Scope): TypeDefinition {
        const calleeReturnType = this.findType(node.callee, scope).id;

        return { id: calleeReturnType }
    }

    private structMethodAccessor(node: StructMethodAccessor, scope: Scope): TypeDefinition {
        const structType = this.findType(node.struct, scope).id;
        const typeDef = typeDefinitions.find(type => type.id === structType);
        if (typeDef === undefined) return { id: "Unknown" }

        const methodDef = typeDef.staticMethods?.find(method => method.id === node.method.value);
        if (methodDef === undefined) return { id: "Unknown" }

        return { id: methodDef.returns }
    }

    private identifier(node: Identifier, scope: Scope): TypeDefinition {
        const scopeType = scope.variables.find(variable => variable.id == node.value);
        const defType = typeDefinitions.find(def => def.id === node.value)

        if (scopeType !== undefined) {
            return { id: scopeType.type };
        }

        if (defType !== undefined) {
            return { id: defType.id }
        }

        return { id: "Unknown" }
    }

    private number(node: any, scope: Scope): TypeDefinition {
        return { id: "Number" }
    }
} 

type Defintion = { id: string, properties?: MemberProperty[], methods?: MemberMethod[], staticMethods?: MemberStaticMethod[] }

const MathDef: Defintion = {
    id: "Math",
    staticMethods: [
        { id: "Sin", returns: "Number" },
        { id: "Cos", returns: "Number" },
        { id: "Tan", returns: "Number" },
        { id: "Floor", returns: "Number" },
    ]
}

const ThreadDef: Defintion = {
    id: "Thread",
    staticMethods: [
        { id: "Sleep", returns: "Void" }
    ]
}

const PixelBufferDef: Defintion = {
    id: "PixelBuffer",
    staticMethods: [
        { id: "New", returns: "PixelBuffer" }
    ],
    methods: [
        { id: "DrawPixel", returns: "Void" },
        { id: "DrawLine", returns: "Void" },
        { id: "DrawCircle", returns: "Void" },
        { id: "DrawText", returns: "Void" },
    ]
}

const DisplayDef: Defintion = {
    id: "Display",
    staticMethods: [
        { id: "Connect", returns: "Display" }
    ],
    methods: [
        { id: "DrawBuffer", returns: "Void" }
    ]
}

export const typeDefinitions: Defintion[] = [
    { id: "Number" },
    { id: "String" },
    { id: "Boolean" }, 
    MathDef, 
    ThreadDef,
    PixelBufferDef,
    DisplayDef
]