import { Context } from "./Context";
import { Literal } from "./Primitives/Literal";
import { NativeFunction } from "./Primitives/NativeFunction";
import { Struct } from "./Primitives/Struct";
import { StructRuntime } from "./Primitives/StructRuntime";
import { BooleanStruct } from "./Structs/BooleanStruct";
import { NumberStruct } from "./Structs/NumberStruct";
import { StringStruct } from "./Structs/StringStruct";
import { Atom, BinaryExpression, BlockStatement, CallExpression, FunctionDefStatement, IfStatement, LogicalExpression, MemberExpression, ReturnStatement, StatementCommon, StructDefStatement, StructImplStatement, VariableDeclaration, WhileStatement } from "../Parser"
import { Function } from "./Primitives/Function";

export function createStructInstance(struct: Struct) {
    const structCtx = new Context(undefined);
    struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));
    return new StructRuntime(struct, structCtx);
}

export class Interpreter {
    ast: any;
    code: string;
    globals: Context;

    constructor(ast: any, code: string, globals: Context) {
        this.ast = ast
        this.code = code;
        this.globals = globals;
    }

    execute = async () => {
        try {
            const ctx = new Context(this.globals);
            return await this.findTraverseFunc(this.ast, ctx);
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
    findTraverseFunc = async (node: any, ctx: Context): Promise<[any, Context]> => {
        const types = [
            // Statements
            { type: "BlockStatement", func: this.blockStatement },
            { type: "IfStatement", func: this.ifStatement },
            { type: "WhileStatement", func: this.whileStatement },

            // Structs
            { type: "StructDeclaration", func: this.structDeclaration },
            { type: "StructImpl", func: this.structImpl },
            { type: "StructMethodAccessor", func: this.structMethodAccessor },
            { type: "StructExpression", func: this.structExpression },

            // Functions
            { type: "CallExpression", func: this.callExpression },
            { type: "FunctionDeclaration", func: this.functionDeclaration },

            // Expressions
            { type: "VariableDeclaration", func: this.variableDeclaration },
            { type: "MemberExpression", func: this.memberExpression },
            { type: "BinaryExpression", func: this.binaryExpression },
            { type: "LogicalExpression", func: this.logicalExpression },
            { type: "IndexExpression", func: this.indexExpression },

            // Primitives 
            { type: "Identifier", func: this.identifier },
            { type: "Number", func: this.primitiveNumber },
            { type: "Boolean", func: this.primitiveBoolean },
            { type: "String", func: this.primitiveString },
            { type: "Array", func: this.primitiveArray }
        ]

        // Find the internal function for interpreting a node
        const type = types.find(type => type.type === node.type);
        if (type == undefined) throw this.interpreterError(`traverse function does not exist for ${node.type}`);

        // Bind the function back to the Interpreter object
        const result = await (type.func.bind(this)(node, ctx));
        return result;
    }

    /* Statements */
    private blockStatement = async (node: BlockStatement, ctx: Context): Promise<[any, Context]> => {
        for (var i = 0; i < node.body.length; i++) {
            const statement = node.body[i];

            // Return Keyword in blockStatements
            if (statement.type === "ReturnExpression") {
                return await this.findTraverseFunc((statement as ReturnStatement).value, ctx);
            }

            // Sets the context to the result from running the statement
            var [_, ctx] = await this.findTraverseFunc(statement, ctx);
        }

        // Returns null if no 'return' keyword in block evaluated
        return [null, ctx];
    }

    private ifStatement = async (node: IfStatement, ctx: Context): Promise<[any, Context]> => {
        var [test, ctx]: [StructRuntime, Context] = await this.findTraverseFunc(node.test, ctx);
        // Check it is a boolean
        if (test.struct.id != "Boolean") throw this.runtimeErrorCode(
            `If Statement test must be of type 'Boolean' instead got ${test.struct.id}`,
            node.test.start, node.test.end
        )
        // Evaluated false
        if (!test.selfCtx.getVariable("value").value) return [null, ctx];

        // Evaluated true
        var [_, ctx] = await this.findTraverseFunc(node.consequent, ctx);
        return [null, ctx];
    }

    private whileStatement = async (node: WhileStatement, ctx: Context): Promise<[any, Context]> => {
        while (true) {
            var [test, ctx]: [StructRuntime, Context] = await this.findTraverseFunc(node.test, ctx);
            // Check it is a boolean
            if (test.struct.id != "Boolean") throw this.runtimeErrorCode(
                `If Statement test must be of type 'Boolean' instead got ${test.struct.id}`,
                node.test.start, node.test.end
            )
            // Evaluated false
            if (!test.selfCtx.getVariable("value").value) break;
            var [_, ctx] = await this.findTraverseFunc(node.consequent, ctx);
        }

        return [null, ctx];
    }

    /* Structs */
    private structDeclaration = async (node: StructDefStatement, ctx: Context): Promise<[null, Context]> => {
        ctx.setVariable(node.id, new Struct(node.id, node.fields));
        return [null, ctx];
    }

    private structImpl = async (node: StructImplStatement, ctx: Context): Promise<[null, Context]> => {
        // Get a copy of the struct and implement the functions
        const struct = ctx.getVariable(node.structId) as Struct;
        // @ts-ignore
        struct.implementFunctions(node.functions);

        // Save copy to context
        ctx.setVariable(node.structId, struct);
        return [null, ctx];
    }

    private structMethodAccessor = async (node: any, ctx: Context): Promise<[any, Context]> => {
        var [structUnkown, ctx]: [Struct, Context] = await this.findTraverseFunc(node.struct, ctx);
        var struct = structUnkown;

        if (structUnkown instanceof StructRuntime) {
            struct = structUnkown.struct;
        }

        const method = struct.getMethod(node.method.value)!;

        // Return an instance of the function
        if (method instanceof NativeFunction) return [method, ctx];
        return [new Function(node.method.value, method.parameters, method.body), ctx]
    }

    private structExpression = async (node: any, ctx: Context): Promise<[any, Context]> => {
        const struct = ctx.getVariable(node.id.value) as Struct;
        const structCtx = new Context(ctx);

        await node.fields.forEach(async (field: any) => {
            structCtx.setVariable(field[0].value, (await this.findTraverseFunc(field[1], ctx))[0]);
        });

        return [new StructRuntime(struct, structCtx), ctx]
    }

    /* Functions */
    private functionDeclaration = async (node: FunctionDefStatement, ctx: Context): Promise<[null, Context]> => {
        var func = new Function(node.id, node.parameters, node.body);
        ctx.setVariable(node.id, func);
        return [null, ctx];
    }

    private callExpression = async (node: CallExpression, ctx: Context): Promise<[null, Context]> => {
        var [callee, ctx] = await this.findTraverseFunc(node.callee, ctx);

        if (callee instanceof NativeFunction) {
            var args: any[] = []

            for (var i = 0; i < node.arguments.length; i++) {
                const arg = node.arguments[i];
                var [traversedArg, ctx] = await this.findTraverseFunc(arg, ctx);
                args.push(traversedArg)
            }

            return await callee.onCall(this, ctx, args)
        }

        if (callee instanceof Function) {
            var funcCtx = new Context(ctx);

            // Lazy-Check if number of parameters matches arguments
            if (callee.parameters.length != node.arguments.length) {
                throw this.runtimeErrorCode(`fn '${callee.id}' expected ${callee.parameters.length} arguments but recieved ${node.arguments.length}`, node.start, node.end);
            }

            // Check individual arguments if they match parameters
            for (var i = 0; i < callee.parameters.length; i++) {
                const param = callee.parameters[i];
                var [arg, ctx] = await this.findTraverseFunc(node.arguments[i], ctx);

                if (param.paramType != arg.struct.id) {
                    throw this.runtimeErrorCode(`fn '${callee.id}' expected argument ${i} to be type '${param.paramType}' instead got '${arg.struct.id}'`, node.arguments[i].start, node.arguments[i].end)
                }

                funcCtx.setVariable(param.id, arg);
            }

            var [value, funcCtx] = await this.findTraverseFunc(callee.body, funcCtx);
            return [value, ctx];
        }

        throw this.runtimeErrorCode(`Tried to call non Function`, node.start, node.end)
    }

    /* Expressions */
    private variableDeclaration = async (node: VariableDeclaration, ctx: Context): Promise<[null, Context]> => {
        var [value, ctx] = await this.findTraverseFunc(node.init, ctx);
        ctx.setVariable(node.id, value);
        return [null, ctx];
    }

    private memberExpression = async (node: MemberExpression, ctx: Context): Promise<[any, Context]> => {
        var [object, ctx] = await this.findTraverseFunc(node.object, ctx);

        if (object instanceof StructRuntime) {
            return [object.selfCtx.getVariable(node.property.value), ctx];
        }

        else {
            throw this.interpreterError("Member Expression only implements StructRuntime right now")
        }
    }

    private indexExpression = async (node: any, ctx: Context): Promise<[any, Context]> => {
        var [object, ctx]: [StructRuntime, Context] = await this.findTraverseFunc(node.object, ctx);
        var [index, ctx]: [StructRuntime, Context] = await this.findTraverseFunc(node.index, ctx);

        if (!object.hasImplementedFunction("Index"))
            throw this.runtimeErrorCode(`Struct ${object.struct.id} does not implement "Index"`, node.start, node.end)

        const func = object.getImplementedFunction("Index")!

        if (func instanceof NativeFunction) {
            return await func.onCall(this, ctx, [object, index]);
        }

        throw this.interpreterError("indexExpression has not been implemented for none native functions")
    }

    private binaryExpression = async (node: BinaryExpression, ctx: Context): Promise<[any, Context]> => {
        var [left, ctx]: [StructRuntime, Context] = await this.findTraverseFunc(node.left, ctx)
        var [right, ctx]: [StructRuntime, Context] = await this.findTraverseFunc(node.right, ctx)

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
            return await func.onCall(this, ctx, [left, right]);
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

        return await this.findTraverseFunc(func.body, funcCtx);
    }

    private logicalExpression = async (node: LogicalExpression, ctx: Context): Promise<[any, Context]> => {
        var [left, ctx] = await this.findTraverseFunc(node.left, ctx);
        var [right, ctx] = await this.findTraverseFunc(node.right, ctx);

        const handlers = [
            { operator: "&&", handler: "And" },
            { operator: "||", handler: "Or" }
        ]

        const handler = handlers.find(handler => handler.operator == node.operator.value)!.handler
        if (!left.hasImplementedFunction(handler))
            throw this.runtimeErrorCode(`Struct ${left.struct.id} does not implement '${handler}' for operator '${node.operator.value}'`, node.start, node.end)

        const func = left.getImplementedFunction(handler)

        if (func instanceof NativeFunction) {
            return await func.onCall(this, ctx, [left, right]);
        }
        throw this.runtimeError("F")
    }

    /* Primitives */
    private identifier = async (node: any, ctx: Context): Promise<[null, Context]> => {
        const value = ctx.getVariable(node.value);

        if (value === null)
            throw this.runtimeErrorCode(`${node.value} does not exist in the current scope`, node.start, node.end);

        return [value, ctx];
    }

    public primitiveNumber = async (node: { value: number }, ctx: Context): Promise<[StructRuntime, Context]> => {
        const struct = this.globals.getVariable("Number") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<number>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));
        return [new StructRuntime(struct, structCtx), ctx]
    }

    public primitiveString = async (node: { value: string }, ctx: Context): Promise<[StructRuntime, Context]> => {
        const struct = this.globals.getVariable("String") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<string>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));
        return [new StructRuntime(struct, structCtx), ctx]
    }

    public primitiveBoolean = async (node: { value: boolean }, ctx: Context): Promise<[StructRuntime, Context]> => {
        const struct = this.globals.getVariable("Boolean") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<boolean>(node.value))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));

        return [new StructRuntime(struct, structCtx), ctx]
    }

    public primitiveArray = async (node: { value: StatementCommon[] }, ctx: Context): Promise<[StructRuntime, Context]> => {
        var values: any[] = []

        for (var i = 0; i < node.value.length; i++) {
            var [value, ctx] = await this.findTraverseFunc(node.value[i], ctx)
            values.push(value);
        }

        const struct = this.globals.getVariable("Array") as Struct;
        const structCtx = new Context(undefined);

        structCtx.setVariable("value", new Literal<any[]>(values))
        struct.nativeImplements.forEach(nativeFunc => structCtx.setVariable(nativeFunc.id, nativeFunc));

        return [new StructRuntime(struct, structCtx), ctx]
    }
}