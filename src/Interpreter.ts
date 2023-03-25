import { FunctionDeclaration } from "typescript";
import { Context } from "./Context";
import { Assign, BinaryExpression, BlockStatement, BreakStatement as BreakExpression, CallExpression, FunctionDefStatement, Identifier, IfStatement, LoopStatement, MemberAssign, MemberExpression, Program, StatementCommon, StructMethodAccessor, UnaryExpression, VariableDeclaration, WhileStatement } from "./Parser";
import { Boolean, getBooleanLiteral } from "./Primitives/Boolean";
import { Number } from "./Primitives/Number";
import { String } from "./Primitives/String";
import { CosmicFunction } from "./Struct/CosmicFunction";
import { NativeEnum } from "./Struct/NativeEnum";
import { NativeFunction } from "./Struct/NativeFunction";
import { StructInstance } from "./Struct/StructInstance";
import { StructType } from "./Struct/StructType";

export class Interpreter {
    private code: string;
    errStart: number;
    errEnd: number;
    errMessage: string;

    constructor(code: string) {
        this.code = code
        this.errStart = 0;
        this.errEnd = 0;
        this.errMessage = "";
    }

    //#region Error Reporting
    /**
     * Used to create an error which contains the relevant snippet of code
     * @returns An Error Object
     */
    public runtimeErrorCode = (message: string, startIdx: number, endIdx: number): Error => {
        const lineStart = this.code.lastIndexOf("\n", startIdx) + 1;
        const line = this.code.substring(lineStart, endIdx);
        const lineNum = this.code.substring(0, startIdx).split("\n").length;
        const colNum = startIdx - lineStart + 1;

        const err = new Error(`${message}, at line ${lineNum}, column ${colNum}'`)
        err.stack = ""
        err.name = "Runtime"

        this.errStart = startIdx
        this.errEnd = endIdx
        this.errMessage = message

        return err;
    }

    /**
     * Used for internal issues with the interpreter
     * @returns An Error Object
     */
    public static internalError = (message: string): Error => {
        const err = new Error(`${message}`)
        err.stack = ""
        err.name = "InterpreterError"
        return err;
    }

    /**
     * Will find the accosiated traverse function for any node type
     */
    public findTraverseFunc = async (node: StatementCommon, ctx: Context): Promise<[any, Context]> => {
        const types: { type: string, func: Function }[] = [
            { type: "BlockStatement", func: this.blockStatement },
            { type: "VariableDeclaration", func: this.variableDeclaration },
            { type: "CallExpression", func: this.callExpression },
            { type: "StructMethodAccessor", func: this.structMethodAccessor },
            { type: "Identifier", func: this.identifier },
            { type: "MemberExpression", func: this.memberExpression },
            { type: "Number", func: this.number },
            { type: "String", func: this.string },
            { type: "Boolean", func: this.boolean },
            { type: "BinaryExpression", func: this.binaryExpression },
            { type: "LogicalExpression", func: this.binaryExpression },
            { type: "UnaryExpression", func: this.unaryExpression },
            { type: "IfStatement", func: this.ifStatement },
            { type: "LoopStatement", func: this.loopStatement },
            { type: "Assign", func: this.assign },
            { type: "BreakExpression", func: this.breakExpression },
            { type: "FunctionDeclaration", func: this.functionDeclaration },
            { type: "Program", func: this.program}
        ];
        const type = types.find(type => type.type == node.type);
        if (type == undefined) throw Interpreter.internalError(`Traverse function does not exist for type '${node.type}'`);

        // Rebind the function to the interpreter
        const result = await (type.func.bind(this)(node, ctx));
        return result;
    }
    //#endregion

    private program = async (node: Program, ctx: Context): Promise<[any, Context]> => {
        // ...Add all non main methods into the context;
        for (var i = 0; i < node.functions.length; i++) {
            var [_, ctx] = await this.findTraverseFunc(node.functions[i], ctx);
        }

        // Execute the main function
        var entryContext = new Context(ctx);
        var [_, entryContext] = await this.findTraverseFunc(node.entryPoint.body, entryContext);

        return [null, ctx];
    }

    //#region Statements
    private blockStatement = async (node: BlockStatement, ctx: Context): Promise<[any, Context]> => {
        for (var i = 0; i < node.body.length; i++) {
            const statement = node.body[i];
            var [result, ctx] = await this.findTraverseFunc(statement, ctx);

            if (result?.type == "BreakExpression") {
                return [result, ctx];
            }
        }

        return [null, ctx];
    }

    private ifStatement = async (node: IfStatement, ctx: Context): Promise<[any, Context]> => {
        var [test, ctx]: [StructInstance, Context] = await this.findTraverseFunc(node.test, ctx);
        if (test.structType.id != "Boolean") throw this.runtimeErrorCode(
            `If Test Statement must resolve to type of Boolean, instead got ${test.structType.id}`,
            node.test.start,
            node.test.end
        )
        const value = getBooleanLiteral(test);

        if (value) {
            var [result, ctx] = await this.findTraverseFunc(node.consequent, ctx);
            return [result, ctx];
        }
        else if (node.elseConsequent != null) {
            var [result, ctx] = await this.findTraverseFunc(node.elseConsequent, ctx);
            return [result, ctx];
        }

        return [null, ctx];
    }

    private loopStatement = async (node: LoopStatement, ctx: Context): Promise<[any, Context]> => {
        while (true) {
            var [result, ctx] = await this.findTraverseFunc(node.body, ctx);
            if (result?.type === "BreakExpression") break;
        }

        return [null, ctx]
    }
    //#endregion

    //#region Expressions
    private binaryExpression = async (node: BinaryExpression, ctx: Context): Promise<[any, Context]> => {
        var [left, ctx]: [StructInstance, Context] = await this.findTraverseFunc(node.left, ctx);
        var [right, ctx]: [StructInstance, Context] = await this.findTraverseFunc(node.right, ctx);

        const handlers = [
            /* Arithmetic Operations */
            { operator: "+", handler: "Add" },
            { operator: "-", handler: "Minus" },
            { operator: "*", handler: "Mul" },
            { operator: "%", handler: "Mod" },
            { operator: "**", handler: "Pow" },
            { operator: "/", handler: "Div" },

            /* Comparison Operations */
            { operator: "==", handler: "EE" },
            { operator: "!=", handler: "NE" },
            { operator: ">", handler: "GT" },
            { operator: ">=", handler: "GTE" },
            { operator: "<", handler: "LT" },
            { operator: "<=", handler: "LTE" },
            { operator: "&&", handler: "And" },
            { operator: "||", handler: "Or" }
        ]

        const methodName = handlers.find(handler => handler.operator == node.operator.value)!.handler;
        if (!left.hasImplementedMethod(methodName))
            throw this.runtimeErrorCode(
                `${left.structType.id} does not implement '${methodName}' for operator '${node.operator.value}'`,
                node.start,
                node.end
            )

        const method = left.getImplementedMethod(methodName);

        if (method instanceof NativeFunction) {
            return await method.onCall(this, ctx, node.start, node.end, [left, right])
        }

        throw Interpreter.internalError("Operator overloading not implemented for Non-Native Types")
    }

    private unaryExpression = async (node: UnaryExpression, ctx: Context): Promise<[any, Context]> => {
        var [right, ctx]: [StructInstance, Context] = await this.findTraverseFunc(node.argument, ctx);

        const handlers = [
            /* Arithmetic Operations */
            { operator: "!", handler: "Not" },
            { operator: "-", handler: "Negative" },
        ]

        const methodName = handlers.find(handler => handler.operator == node.operator)!.handler;

        if (!right.hasImplementedMethod(methodName))
            throw this.runtimeErrorCode(
                `${right.structType.id} does not implement '${methodName}' for operator '${node.operator}'`,
                node.start,
                node.end
            )

        const method = right.getImplementedMethod(methodName);

        if (method instanceof NativeFunction) {
            return await method.onCall(this, ctx, node.start, node.end, [right])
        }

        throw Interpreter.internalError("Operator overloading not implemented for Non-Native Types")
    }

    private breakExpression = async (node: BreakExpression, ctx: Context): Promise<[any, Context]> => {
        return [node, ctx];
    }
    //#endregion

    //#region Variables
    private variableDeclaration = async (node: VariableDeclaration, ctx: Context): Promise<[any, Context]> => {
        var [init, ctx] = await this.findTraverseFunc(node.init, ctx);
        ctx.setSymbol(node.id, init);
        return [null, ctx];
    }

    private identifier = async (node: Identifier, ctx: Context): Promise<[any, Context]> => {
        const symbolTableValue = ctx.getSymbol<any>(node.value);
        const structsValue = ctx.getStructType(node.value);
        const methodsValue = ctx.getMethod(node.value);

        if (symbolTableValue !== undefined) return [symbolTableValue, ctx];
        if (structsValue !== undefined) return [structsValue, ctx];
        if (methodsValue !== undefined) return [methodsValue, ctx];

        throw this.runtimeErrorCode(`${node.value} does not exist in this current context`, node.start, node.end)
    }

    private assign = async (node: Assign, ctx: Context): Promise<[any, Context]> => {
        if (node.left.type != "Identifier") throw this.runtimeErrorCode(
            `Can only assign to Identifier instead got ${node.left.type}`,
            node.start,
            node.end
        )

        if (ctx.getSymbol(node.left.value) == undefined) {
            throw this.runtimeErrorCode(
                `'${node.left.value}' is defined in the current context`,
                node.start,
                node.end
            )
        }

        var [value, ctx] = await this.findTraverseFunc(node.value, ctx);
        ctx.setSymbol(node.left.value, value);
        return [null, ctx]
    }
    //#endregion

    //#region Functions
    private functionDeclaration = async (node: FunctionDefStatement, ctx: Context): Promise<[any, Context]> => {
        ctx.setMethod(node.id, new CosmicFunction(node.id, node.parameters, node.body));
        return [null, ctx];
    }

    private callExpression = async (node: CallExpression, ctx: Context): Promise<[any, Context]> => {
        var [callee, ctx] = await this.findTraverseFunc(node.callee, ctx);
        var args: any[] = []

        for (var i = 0; i < node.arguments.length; i++) {
            const arg = node.arguments[i];
            var [traversedArg, ctx] = await this.findTraverseFunc(arg, ctx);
            args.push(traversedArg)
        }

        // Native Function Execution
        if (callee instanceof NativeFunction) {
            var [value, ctx] = await callee.onCall(this, ctx, node.start, node.end, args);
            return [value, ctx];
        }

        if (callee instanceof CosmicFunction) {
            if (node.arguments.length != callee.parameters.length) throw this.runtimeErrorCode(
                `fn '${callee.id}' expected ${callee.parameters.length} argument(s), recieved ${node.arguments.length}`,
                node.start,
                node.end
            )
            
            var functionCtx = new Context(ctx);

            for (var i = 0; i < callee.parameters.length; i++) {
                const param = callee.parameters[i];
                var [arg, ctx]: [StructInstance, Context] = await this.findTraverseFunc(node.arguments[i], ctx);
                if (arg.structType.id !== param.paramType) throw this.runtimeErrorCode(
                    `Fn '${callee.id}' expected argument ${i} to be of type '${param.paramType}', recieved '${arg.structType.id}'`,
                    node.start,
                    node.end
                )

                functionCtx.setSymbol(param.id, arg)
            }

            var [value, functionCtx] = await this.findTraverseFunc(callee.functionBody, functionCtx);

            return [value, ctx]
        }

        throw Interpreter.internalError("Calling functions not yet implemented!");
    }
    //#endregion

    //#region Structs 
    private structMethodAccessor = async (node: StructMethodAccessor, ctx: Context): Promise<[any, Context]> => {
        var [struct, ctx]: [StructType, Context] = await this.findTraverseFunc(node.struct, ctx);
        const nativeFunc = struct.nativeMethods.find(method => method.id == node.method.value);

        // Push the struct to the stack so that it can be accessed in the nativeFunction
        ctx.stack.push({ node: struct, value: node.struct });

        return [nativeFunc, ctx];
    }

    private memberExpression = async (node: MemberExpression, ctx: Context): Promise<[any, Context]> => {
        var [object, ctx] = await this.findTraverseFunc(node.object, ctx);

        if (object instanceof StructInstance) {
            const value = object.selfCtx.getSymbol(node.property.value);
            if (value == null)
                throw this.runtimeErrorCode(`'${node.property.value}' does not exist on struct '${object.structType.id}'`, node.start, node.end);

            ctx.stack.push({ node: object, value: node.property.value });
            return [value, ctx];
        }

        else if (object instanceof NativeEnum) {
            const index = object.values.findIndex(i => i == node.property.value);
            if (index === -1) {
                throw this.runtimeErrorCode(
                    `Value '${node.property.value}' does not exist on Enum '${object.id}'`,
                    node.start,
                    node.end
                )
            }
            return this.number({ value: index }, ctx);
        }

        throw Interpreter.internalError(`Member expression logic does not exist for ${object.constructor.name}`)
    }

    private memberAssign = async (node: MemberAssign, ctx: Context): Promise<[any, Context]> => {
        await this.findTraverseFunc(node.object, ctx);
        var [value, ctx]: [StructInstance, Context] = await this.findTraverseFunc(node.value, ctx);
        var identifier = ctx.stack.pop();
        var object = ctx.stack.pop();

        object.node.selfCtx.setSymbol(identifier.value, value);
        return [null, ctx]
    }
    //#endregion

    //#region Primitives
    public number = async (node: { value: number }, ctx: Context): Promise<[any, Context]> => {
        const instance = new StructInstance(Number);
        instance.selfCtx.setProtected("value", node.value);
        return [instance, ctx];
    }

    public string = async (node: { value: string }, ctx: Context): Promise<[any, Context]> => {
        const instance = new StructInstance(String);
        instance.selfCtx.setProtected("value", node.value);
        return [instance, ctx];
    }

    public boolean = async (node: { value: boolean }, ctx: Context): Promise<[any, Context]> => {
        const instance = new StructInstance(Boolean);
        instance.selfCtx.setProtected("value", node.value);
        return [instance, ctx];
    }
    //#endregion
}