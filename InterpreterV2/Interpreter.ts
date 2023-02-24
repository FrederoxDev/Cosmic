import { Context } from "./Context";
import { Literal } from "./Primitives/Literal";
import { NativeFunction } from "./Primitives/NativeFunction";
import { Struct } from "./Primitives/Struct";
import { StructRuntime } from "./Primitives/StructRuntime";
import { BooleanStruct } from "./Structs/BooleanStruct";
import { NumberStruct } from "./Structs/NumberStruct";
import { StringStruct } from "./Structs/StringStruct";
import { Atom, BinaryExpression, BlockStatement, CallExpression, FunctionDefStatement, LogicalExpression, MemberExpression, ReturnStatement, StructDefStatement, StructImplStatement, VariableDeclaration } from "../Parser"
import { Function } from "./Primitives/Function";

export class Interpreter {
    ast: any;
    globals: Context;

    constructor(ast: any) {
        this.ast = ast

        const globals = new Context(undefined)
        globals.setStruct("Number", NumberStruct)
        globals.setStruct("Boolean", BooleanStruct)
        globals.setStruct("String", StringStruct)

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

            return [this.findTraverseFunc(this.ast, ctx)[0], null]
        }

        catch (e) {
            return [null, e]
        }
    }

    runtimeError = (message: string): Error => {
        const err = new Error(`${message}`)
        err.stack = ""
        err.name = "Runtime"

        return err;
    }

    /** 
     * Checks the type of a StructRuntime
     * @throws Will throw if type does not match expectedType
     */
    assertType = (expectedType: string, operator: string, rhs: StructRuntime): StructRuntime => {
        if (rhs.struct.id != expectedType)
            throw this.runtimeError(`Operator '${operator}' expected '${expectedType}' instead got '${rhs.struct.id}'`)

        return rhs
    }

    /** Will find the function accosiated with a specific node */
    findTraverseFunc = (node: any, ctx: Context): [any, Context] => {
        console.log("Find", node.type)
        if (node.start == undefined) console.warn(`${node.type} does not contain a start position!`)

        const types = [
            { type: "BlockStatement", func: this.blockStatement },
            { type: "Number", func: this.primitiveNumber },
            { type: "Boolean", func: this.primitiveBoolean },
            { type: "String", func: this.primitiveString },
            { type: "Identifier", func: this.identifier },
            { type: "BinaryExpression", func: this.binaryExpression },
            { type: "LogicalExpression", func: this.logicalExpression },
            { type: "CallExpression", func: this.callExpression },
            { type: "FunctionDeclaration", func: this.functionDeclaration },
            { type: "StructMethodAccessor", func: this.structMethodAccessor },
            { type: "StructDeclaration", func: this.structDeclaration },
            { type: "StructImpl", func: this.structImpl },
            { type: "StructExpression", func: this.structExpression },
            { type: "MemberExpression", func: this.memberExpression },
            { type: "VariableDeclaration", func: this.variableDeclaration }
        ]

        const type = types.find(type => type.type == node.type)
        if (type == undefined) throw new Error(`traverse function does not exist for ${node.type}`)
        const result = type.func.bind(this)(node, ctx)
        
        if (result == undefined) {
            throw new Error("Result was undefined");
        }

        var [value, newCtx] = result

        if ((newCtx as Context).variables["Foo"]) {
            console.log("Found Foo!", node.type)
        }
        else {
            console.log("Foo not found!", node.type)
        }

        return [value, newCtx]
    }

    /* Operations */
    private binaryExpression = (node: BinaryExpression, ctx: Context): [any, Context] => {
        const left = this.findTraverseFunc(node.left, ctx)[0] as StructRuntime;
        const right = this.findTraverseFunc(node.right, ctx)[0] as StructRuntime;

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
            throw this.runtimeError(`Struct ${left.struct.id} does not implement '${handler}' for operator '${node.operator.value}'`)

        const func = left.getFunction(handler)
        return func.onCall(this, ctx, [left, right]);
    }

    private logicalExpression = (node: LogicalExpression, ctx: Context): [any, Context] => {
        const left = this.findTraverseFunc(node.left, ctx)[0] as StructRuntime;
        const right = this.findTraverseFunc(node.right, ctx)[0] as StructRuntime;

        const handlers = [
            { operator: "&&", handler: "And" },
            { operator: "||", handler: "Or" }
        ]

        const handler = handlers.find(handler => handler.operator == node.operator.value)!.handler
        if (!left.hasFunction(handler))
            throw this.runtimeError(`Struct ${left.struct.id} does not implement '${handler}' for operator '${node.operator.value}'`)

        const func = left.getFunction(handler)
        return func.onCall(this, ctx, left, right);
    }

    /* Statements */
    private blockStatement = (node: BlockStatement, ctx: Context): [any, Context] => {
        for (var i = 0; i < node.body.length; i++) {
            const statement = node.body[i];

            if (statement.type == "ReturnExpression") {
                var result = this.findTraverseFunc((statement as ReturnStatement).value, ctx)
                var value = result[0]
                ctx = result[1]
                return [value, ctx];
            }

            else {
                var result = this.findTraverseFunc(statement, ctx)
                ctx = result[1]
            }
        }

        return [null, ctx]
    }

    /* Structs */
    private structDeclaration = (node: StructDefStatement, ctx: Context): [any, Context] => {
        ctx.variables[node.id] = new Struct(node.id, node.fields);

        return [null, ctx]
    }

    private structImpl = (node: StructImplStatement, ctx: Context): [any, Context] => {
        const struct = ctx.getStruct(node.structId)!;
        struct.implementFunctions(node.functions);
        ctx.setVariable(node.structId, struct)
        return [null, ctx];
    }

    private structExpression = (node: any, ctx: Context): [any, Context] => {
        const struct = ctx.getStruct(node.id.value) as Struct;

        if (struct == undefined) {
            console.log("Undefined Struct Epxression", ctx.variables)
            throw new Error("Could not get struct in context");
        }

        const structCtx = new Context(this.globals);

        node.fields.forEach((field: any) => {
            structCtx.setVariable(field[0].value, this.findTraverseFunc(field[1], ctx)[0]);
        });

        return [new StructRuntime(struct, structCtx), ctx]
    }

    private structMethodAccessor = (node: any, ctx: Context): [any, Context] => {
        const struct = this.findTraverseFunc(node.struct, ctx)[0] as unknown as Struct;

        const method = struct.getMethod(node.method.value)!;
        
        if (method instanceof NativeFunction) return [method, ctx];
        return [new Function(node.method.value, method.parameters, method.body), ctx]
    }

    /* Expressions */
    private memberExpression = (node: MemberExpression, ctx: Context): [any, Context] => {
        const object: any = this.findTraverseFunc(node.object, ctx)[0];

        if (object instanceof StructRuntime) {
            return [object.selfCtx.getVariable(node.property.value), ctx];
        }

        else {
            throw this.runtimeError("Member Expression only implements StructRuntime right now")
        }
    }

    private variableDeclaration = (node: VariableDeclaration, ctx: Context): [any, Context] => {
        const value = this.findTraverseFunc(node.init, ctx)[0];
        ctx.setVariable(node.id, value)

        return [null, ctx]
    }
    
    /* Functions */
    private callExpression = (node: CallExpression, ctx: Context): [any, Context] => {
        const callee = this.findTraverseFunc(node.callee, ctx)[0] as any;

        if (callee instanceof NativeFunction) {
            var args: any = node.arguments.map((arg: any) => this.findTraverseFunc(arg, ctx)[0])
            return callee.onCall(this, ctx, args)
        }

        else if (callee instanceof Function) {
            const funcCtx = new Context(this.globals);

            if (callee.parameters.length != node.arguments.length) {
                throw this.runtimeError(`fn '${callee.id}' expected ${callee.parameters.length} arguments but recieved ${node.arguments.length}`);
            }

            for (var i = 0; i < callee.parameters.length; i++) {
                const param = callee.parameters[i];
                const arg = this.findTraverseFunc(node.arguments[i], ctx)[0] as StructRuntime;

                if (param.paramType != arg.struct.id) {
                    throw this.runtimeError(`fn '${callee.id}' expected argument ${i} to be type '${param.paramType}' instead got '${arg.struct.id}'`)
                }

                funcCtx.setVariable(param.id, arg);
            }

            return [this.findTraverseFunc(callee.body, funcCtx)[0], ctx];
        }

        else {
            throw this.runtimeError("Tried to call non Function")
        }
    }

    private functionDeclaration = (node: FunctionDefStatement, ctx: Context): [any, Context] => {
        const func = new Function(node.id, node.parameters, node.body);
        ctx.setVariable(node.id, func)
        return [null, ctx]
    }

    /* PRIMITIVES */
    public primitiveNumber = (node: { value: number }, ctx: Context): [StructRuntime, Context] => {
        const struct = this.globals.getStruct("Number") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<number>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));
        return [new StructRuntime(struct, structCtx), ctx]
    }

    public primitiveString = (node: { value: string }, ctx: Context): [StructRuntime, Context] => {
        const struct = this.globals.getStruct("String") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<string>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));
        return [new StructRuntime(struct, structCtx), ctx]
    }

    public primitiveBoolean = (node: { value: boolean }, ctx: Context): [StructRuntime, Context] => {
        const struct = this.globals.getStruct("Boolean") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<boolean>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));

        return [new StructRuntime(struct, structCtx), ctx]
    }

    private identifier = (node: any, ctx: Context): [any, Context] => {
        const value = ctx.variables[node.value]

        if (value === undefined && ctx.parent == undefined) {
            throw this.runtimeError(`'${node.value}' does not exist in current scope`)
        }
        else if (value === undefined && ctx.parent != undefined) {
            return this.identifier(node, ctx.parent);
        }

        console.log(value, ctx.variables)
        return [value, ctx]
    }
}