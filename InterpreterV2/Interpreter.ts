import { Context } from "./Context";
import { Literal } from "./Primitives/Literal";
import { Struct } from "./Primitives/Struct";
import { StructRuntime } from "./Primitives/StructRuntime";
import { BooleanStruct } from "./Structs/BooleanStruct";
import { NumberStruct } from "./Structs/NumberStruct";

export class Interpreter {
    ast: any;
    globals: Context;

    constructor(ast: any) {
        this.ast = ast

        const globals = new Context(undefined)
        globals.setStruct("number", NumberStruct)
        globals.setStruct("boolean", BooleanStruct)

        this.globals = globals;
    }

    execute = () => {
        try {
            const ctx = new Context(this.globals)

            return [this.findTraverseFunc(this.ast, ctx), null]
        }

        catch(e) {
            return [null, e]
        }
    }

    runtimeError = (message: string): Error => {    
        const err = new Error(`${message}`)
        err.stack = ""
        err.name = "Runtime"

        throw err;
    }

    assertType = (expectedType: string, operator: string, rhs: StructRuntime): StructRuntime => {
        if (rhs.struct.id != expectedType)
            this.runtimeError(`Operator '${operator}' expected '${expectedType}' instead got '${rhs.struct.id}'`)
        
        return rhs
    }

    findTraverseFunc = (node: any, ctx: Context) => {
        const types = [
            { type: "BlockStatement", func: this.blockStatement },
            { type: "Number", func: this.primitiveNumber },
            { type: "Boolean", func: this.primitiveBoolean },
            { type: "BinaryExpression", func: this.binaryExpression },
            { type: "LogicalExpression", func: this.logicalExpression }
        ]

        const type = types.find(type => type.type == node.type)
        if (type == undefined) throw new Error(`traverse function does not exist for ${node.type}`)
        return type.func.bind(this)(node, ctx)
    }

    /* Operations */
    binaryExpression = (node: any, ctx: Context) => {
        const left = this.findTraverseFunc(node.left, ctx) as StructRuntime;
        const right = this.findTraverseFunc(node.right, ctx) as StructRuntime;

        const handlers = [
            /* Arithmetic Operations */
            { operator: "+", handler: "Add" },
            { operator: "-", handler: "Minus" },
            { operator: "*", handler: "Mul" },
            { operator: "**", handler: "Pow" },
            { operator: "/", handler: "Div" },

            /* Comparison Operations */
            { operator: "==", handler: "EE" },
            { operator: "!=", handler: "NE" },
            { operator: ">", handler: "GT" },
            { operator: ">=", handler: "GTE" },
            { operator: "<", handler: "LT" },
            { operator: "<=", handler: "LTE" },
        ]

        const handler = handlers.find(handler => handler.operator == node.operator.value)!.handler
        if (!left.hasFunction(handler)) 
            this.runtimeError(`Struct ${left.struct.id} does not implement '${handler}' for operator '${node.operator.value}'`)
        
        const func = left.getFunction(handler)
        return func.onCall(this, ctx, left, right);
    }

    logicalExpression = (node: any, ctx: Context) => {
        const left = this.findTraverseFunc(node.left, ctx) as StructRuntime;
        const right = this.findTraverseFunc(node.right, ctx) as StructRuntime;

        const handlers = [
            { operator: "&&", handler: "And" },
            { operator: "||", handler: "Or" }
        ]

        const handler = handlers.find(handler => handler.operator == node.operator.value)!.handler
        if (!left.hasFunction(handler)) 
            this.runtimeError(`Struct ${left.struct.id} does not implement '${handler}' for operator '${node.operator.value}'`)
        
        const func = left.getFunction(handler)
        return func.onCall(this, ctx, left, right);
    }

    /* Statements */
    blockStatement = (node: {body: any[], start: number, end: number}, ctx: Context): void => {
        // Todo: Implement return statements
        node.body.forEach(node => {
            console.log("[BlockStatement] >", this.findTraverseFunc(node, ctx)?.selfCtx?.getVariable("value").value)
        });
    }

    /* PRIMITIVES */
    primitiveNumber = (node: { value: number }, ctx: Context): StructRuntime => {
        const struct = this.globals.getStruct("number") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<number>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));
        return new StructRuntime(struct, structCtx)
    }

    primitiveBoolean = (node: { value: boolean }, ctx: Context): StructRuntime => {
        const struct = this.globals.getStruct("boolean") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<boolean>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));
        return new StructRuntime(struct, structCtx)
    }
}