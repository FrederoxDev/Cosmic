import { Context } from "./Context";
import { Literal } from "./Primitives/Literal";
import { NativeFunction } from "./Primitives/NativeFunction";
import { Struct } from "./Primitives/Struct";
import { StructRuntime } from "./Primitives/StructRuntime";
import { BooleanStruct } from "./Structs/BooleanStruct";
import { NumberStruct } from "./Structs/NumberStruct";
import { StringStruct } from "./Structs/StringStruct";

export class Interpreter {
    ast: any;
    globals: Context;

    constructor(ast: any) {
        this.ast = ast

        const globals = new Context(undefined)
        globals.setStruct("number", NumberStruct)
        globals.setStruct("boolean", BooleanStruct)
        globals.setStruct("string", StringStruct)

        globals.setVariable("log", new NativeFunction("log", (interpreter, ctx, args) => {
            var out: string[] = [];

            args.forEach((arg: StructRuntime | Struct | NativeFunction) => {
                if (arg instanceof StructRuntime) {
                    if (!arg.hasFunction("Inspect")) return out.push(arg?.inspect?.());
                    const inspect = arg.getFunction("Inspect")

                    if (inspect instanceof NativeFunction) {
                        const res = inspect.onCall(interpreter, ctx, arg) as StructRuntime;
                        out.push(res.selfCtx.getVariable("value").value)
                    }
                }

                else if (arg instanceof Struct) {
                    out.push(arg.inspect())
                }

                else if (arg instanceof NativeFunction) {
                    out.push(arg.inspect());
                }
            })

            console.log("\x1b[90m>\x1b[37m", ...out)
        }))

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

    /** 
     * Checks the type of a StructRuntime
     * @throws Will throw if type does not match expectedType
     */
    assertType = (expectedType: string, operator: string, rhs: StructRuntime): StructRuntime => {
        if (rhs.struct.id != expectedType)
            this.runtimeError(`Operator '${operator}' expected '${expectedType}' instead got '${rhs.struct.id}'`)
        
        return rhs
    }

    /** Will find the function accosiated with a specific node */
    findTraverseFunc = (node: any, ctx: Context) => {
        const types = [
            { type: "BlockStatement", func: this.blockStatement },
            { type: "Number", func: this.primitiveNumber },
            { type: "Boolean", func: this.primitiveBoolean },
            { type: "String", func: this.primitiveString },
            { type: "Identifier", func: this.identifier },
            { type: "BinaryExpression", func: this.binaryExpression },
            { type: "LogicalExpression", func: this.logicalExpression },
            { type: "CallExpression", func: this.callExpression },
            { type: "StructMethodAccessor", func: this.structMethodAccessor }
        ]

        const type = types.find(type => type.type == node.type)
        if (type == undefined) throw new Error(`traverse function does not exist for ${node.type}`)
        return type.func.bind(this)(node, ctx)
    }

    /* Expressions */
    private callExpression = (node: any, ctx: Context) => {
        const callee = this.findTraverseFunc(node.callee, ctx) as any;

        // Todo: Implement Non-Native Functions with paramer type checking

        if (callee instanceof NativeFunction) {
            var args = node.arguments.map((arg: any) => this.findTraverseFunc(arg, ctx))
            return callee.onCall(this, ctx, args)
        }
    }

    private structMethodAccessor = (node: any, ctx: Context) => {
        const struct = this.findTraverseFunc(node.struct, ctx) as unknown as Struct;
        return struct.getMethod(node.method.value);
    }

    /* Operations */
    private binaryExpression = (node: any, ctx: Context) => {
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
        return func.onCall(this, ctx, [left, right]);
    }

    private logicalExpression = (node: any, ctx: Context) => {
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
    private blockStatement = (node: {body: any[], start: number, end: number}, ctx: Context): void => {
        // Todo: Implement return statements
        node.body.forEach(node => {
            this.findTraverseFunc(node, ctx)
        });
    }

    /* PRIMITIVES */
    public primitiveNumber = (node: { value: number }, ctx: Context): StructRuntime => {
        const struct = this.globals.getStruct("number") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<number>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));
        return new StructRuntime(struct, structCtx)
    }

    public primitiveString = (node: { value: string }, ctx: Context): StructRuntime => {
        const struct = this.globals.getStruct("string") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<string>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));
        return new StructRuntime(struct, structCtx)
    }

    public primitiveBoolean = (node: { value: boolean }, ctx: Context): StructRuntime => {
        const struct = this.globals.getStruct("boolean") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<boolean>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));
        return new StructRuntime(struct, structCtx)
    }

    private identifier = (node: any, ctx: Context): any => {
        const value = ctx.variables[node.value]

        if (value === undefined && ctx.parent == undefined) {
            this.runtimeError(`'${ node.value }' does not exist in current scope`)
        }
        else if (value === undefined && ctx.parent != undefined) {
            return this.identifier(node, ctx.parent);
        }

        return value
    }
}