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
    code: string;
    globals: Context;

    constructor(ast: any, code: string) {
        this.ast = ast
        this.code = code;

        const globals = new Context(undefined)
        globals.setVariable("Number", NumberStruct)
        globals.setVariable("Boolean", BooleanStruct)
        globals.setVariable("String", StringStruct)

        globals.setVariable("log", new NativeFunction("log", (interpreter, ctx, args) => {
            var out: string[] = [];

            for (var i = 0; i < args.length; i++) {
                const arg = args[i];

                if (arg instanceof StructRuntime) {
                    if (!arg.hasImplementedFunction("Inspect")) {
                        out.push(arg?.inspect?.());
                        continue;
                    }
                    const inspect = arg.getImplementedFunction("Inspect")

                    if (inspect instanceof NativeFunction) {
                        var [result, ctx] = inspect.onCall(interpreter, ctx, arg);
                        out.push(result.selfCtx.getVariable("value").value)
                    }
                }

                else if (arg instanceof Struct) {
                    out.push(arg.inspect())
                }

                else if (arg instanceof NativeFunction) {
                    out.push(arg.inspect());
                }

                else {
                    console.log(arg)
                }
            }

            console.log("\x1b[90m>\x1b[37m", ...out)
            return [null, ctx];
        }))

        this.globals = globals;
    }

    execute = () => {
        try {
            const ctx = new Context(this.globals);
            return this.findTraverseFunc(this.ast, ctx);
        }

        catch (e) {
            return e;
        }
    }

    /* Error Reporting */
    runtimeErrorCode = (message: string, startIdx: number, endIdx: number): Error => {
        const lineStart = this.code.lastIndexOf("\n", startIdx) + 1;
        const line = this.code.substring(lineStart, endIdx);
        const lineNum = this.code.substring(0, startIdx).split("\n").length;
        const colNum = startIdx - lineStart + 1;

        const err = new Error(`${message}, at line ${lineNum}, column ${colNum}'`)
        err.stack = ""
        err.name = "Runtime"

        console.log(line);
        console.log(`${" ".repeat(startIdx - lineStart)}${"^".repeat(endIdx - startIdx)}`);
        return err;
    }

    interpreterError = (message: string): Error => {
        const err = new Error(`${message}`)
        err.stack = ""
        err.name = "InterpreterError"

        return err;
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
        const types = [
            // Statements
            { type: "BlockStatement", func: this.blockStatement },

            // Structs
            { type: "StructDeclaration", func: this.structDeclaration },
            { type: "StructImpl", func: this.structImpl },
            { type: "StructMethodAccessor", func: this.structMethodAccessor },
            { type: "StructExpression", func: this.structExpression },

            // Functions
            { type: "CallExpression", func: this.callExpression },

            // Expressions
            { type: "VariableDeclaration", func: this.variableDeclaration },
            { type: "MemberExpression", func: this.memberExpression },
            { type: "BinaryExpression", func: this.binaryExpression },
            { type: "LogicalExpression", func: this.logicalExpression },

            // Primitives 
            { type: "Identifier", func: this.identifier },
            { type: "Number", func: this.primitiveNumber },
            { type: "Boolean", func: this.primitiveBoolean },
            { type: "String", func: this.primitiveString },
        ]

        // Find the internal function for interpreting a node
        const type = types.find(type => type.type === node.type);
        if (type == undefined) throw this.interpreterError(`traverse function does not exist for ${node.type}`);

        // Bind the function back to the Interpreter object
        const result = type.func.bind(this)(node, ctx);
        return result;
    }

    /* Statements */
    private blockStatement = (node: BlockStatement, ctx: Context): [any, Context] => {
        for (var i = 0; i < node.body.length; i++) {
            const statement = node.body[i];

            // Return Keyword in blockStatements
            if (statement.type === "ReturnExpression") {
                return this.findTraverseFunc((statement as ReturnStatement).value, ctx);
            }

            // Sets the context to the result from running the statement
            var [_, ctx] = this.findTraverseFunc(statement, ctx);
        }

        // Returns null if no 'return' keyword in block evaluated
        return [null, ctx];
    }

    /* Structs */
    private structDeclaration = (node: StructDefStatement, ctx: Context): [null, Context] => {
        ctx.setVariable(node.id, new Struct(node.id, node.fields));
        return [null, ctx];
    }

    private structImpl = (node: StructImplStatement, ctx: Context): [null, Context] => {
        // Get a copy of the struct and implement the functions
        const struct = ctx.getVariable(node.structId) as Struct;
        // @ts-ignore
        struct.implementFunctions(node.functions);

        // Save copy to context
        ctx.setVariable(node.structId, struct);
        return [null, ctx];
    }

    private structMethodAccessor = (node: any, ctx: Context): [any, Context] => {
        var [structUnkown, ctx]: [Struct, Context] = this.findTraverseFunc(node.struct, ctx);
        var struct = structUnkown;

        if (structUnkown instanceof StructRuntime) {
            struct = structUnkown.struct;
        }

        const method = struct.getMethod(node.method.value)!;

        // Return an instance of the function
        if (method instanceof NativeFunction) return [method, ctx];
        return [new Function(node.method.value, method.parameters, method.body), ctx]
    }

    private structExpression = (node: any, ctx: Context): [any, Context] => {
        const struct = ctx.getVariable(node.id.value) as Struct;
        const structCtx = new Context(ctx);

        node.fields.forEach((field: any) => {
            structCtx.setVariable(field[0].value, this.findTraverseFunc(field[1], ctx)[0]);
        });

        return [new StructRuntime(struct, structCtx), ctx]
    }

    /* Functions */
    private callExpression = (node: CallExpression, ctx: Context): [null, Context] => {
        var [callee, ctx] = this.findTraverseFunc(node.callee, ctx);

        if (callee instanceof NativeFunction) {
            var args: any = node.arguments.map((arg: any) => this.findTraverseFunc(arg, ctx)[0])
            return callee.onCall(this, ctx, args)
        }

        if (callee instanceof Function) {
            const funcCtx = new Context(ctx);

            // Lazy-Check if number of parameters matches arguments
            if (callee.parameters.length != node.arguments.length) {
                throw this.runtimeErrorCode(`fn '${callee.id}' expected ${callee.parameters.length} arguments but recieved ${node.arguments.length}`, node.start, node.end);
            }

            // Check individual arguments if they match parameters
            for (var i = 0; i < callee.parameters.length; i++) {
                const param = callee.parameters[i];
                var [arg, ctx] = this.findTraverseFunc(node.arguments[i], ctx);

                if (param.paramType != arg.struct.id) {
                    throw this.runtimeErrorCode(`fn '${callee.id}' expected argument ${i} to be type '${param.paramType}' instead got '${arg.struct.id}'`, node.arguments[i].start, node.arguments[i].end)
                }

                funcCtx.setVariable(param.id, arg);
            }

            return this.findTraverseFunc(callee.body, funcCtx);
        }

        throw this.runtimeErrorCode(`Tried to call non Function`, node.start, node.end)
    }

    /* Expressions */
    private variableDeclaration = (node: VariableDeclaration, ctx: Context): [null, Context] => {
        var [value, ctx] = this.findTraverseFunc(node.init, ctx);
        ctx.setVariable(node.id, value);
        return [null, ctx];
    }

    private memberExpression = (node: MemberExpression, ctx: Context): [any, Context] => {
        const object: any = this.findTraverseFunc(node.object, ctx)[0];

        if (object instanceof StructRuntime) {
            return [object.selfCtx.getVariable(node.property.value), ctx];
        }

        else {
            throw this.interpreterError("Member Expression only implements StructRuntime right now")
        }
    }

    private binaryExpression = (node: BinaryExpression, ctx: Context): [any, Context] => {
        var [left, ctx]: [StructRuntime, Context] = this.findTraverseFunc(node.left, ctx)
        var [right, ctx]: [StructRuntime, Context] = this.findTraverseFunc(node.right, ctx)

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

        if (!left.hasImplementedFunction(handler))
            throw this.runtimeErrorCode(`Struct ${left.struct.id} does not implement '${handler}' for operator '${node.operator.value}'`, node.start, node.end)

        const func = left.getImplementedFunction(handler)!

        if (func instanceof NativeFunction) {
            return func.onCall(this, ctx, [left, right]);
        }
        
        const funcCtx = new Context(ctx);

        if (func.parameters.length != 2) 
            throw this.runtimeErrorCode(`Expected '${handler}' for operator '${node.operator.value}' to have 2 parameters, instead got ${func.parameters.length}`, 
            func.parameters[0].start, func.parameters[func.parameters.length - 1].end
        )
        // The left hand side will always be correct so we dont need to check it
        // Right Param
        if (func.parameters[1].paramType != right.struct.id) {
            throw this.runtimeErrorCode(`Expected right hand side to be '${func.parameters[1].paramType}' instead got '${right.struct.id}'`,
                node.right.start, node.right.end
            )
        }

        funcCtx.setVariable(func.parameters[0].id, left);
        funcCtx.setVariable(func.parameters[1].id, right);

        return this.findTraverseFunc(func.body, funcCtx);
    }

    private logicalExpression = (node: LogicalExpression, ctx: Context): [any, Context] => {
        const left = this.findTraverseFunc(node.left, ctx)[0] as StructRuntime;
        const right = this.findTraverseFunc(node.right, ctx)[0] as StructRuntime;

        const handlers = [
            { operator: "&&", handler: "And" },
            { operator: "||", handler: "Or" }
        ]

        const handler = handlers.find(handler => handler.operator == node.operator.value)!.handler
        if (!left.hasImplementedFunction(handler))
            throw this.runtimeErrorCode(`Struct ${left.struct.id} does not implement '${handler}' for operator '${node.operator.value}'`, node.start, node.end)

        const func = left.getImplementedFunction(handler)

        if (func instanceof NativeFunction) {
            return func.onCall(this, ctx, [left, right]);
        }
        throw this.runtimeError("F")
    }

    /* Primitives */
    private identifier = (node: any, ctx: Context): [null, Context] => {
        const value = ctx.getVariable(node.value);

        if (value === null)
            throw this.runtimeErrorCode(`${node.value} does not exist in the current scope`, node.start, node.end);

        return [value, ctx];
    }

    public primitiveNumber = (node: { value: number }, ctx: Context): [StructRuntime, Context] => {
        const struct = this.globals.getVariable("Number") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<number>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));
        return [new StructRuntime(struct, structCtx), ctx]
    }

    public primitiveString = (node: { value: string }, ctx: Context): [StructRuntime, Context] => {
        const struct = this.globals.getVariable("String") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<string>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));
        return [new StructRuntime(struct, structCtx), ctx]
    }

    public primitiveBoolean = (node: { value: boolean }, ctx: Context): [StructRuntime, Context] => {
        const struct = this.globals.getVariable("Boolean") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<boolean>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));

        return [new StructRuntime(struct, structCtx), ctx]
    }
}