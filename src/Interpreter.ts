import { Context } from "./Context";
import { BlockStatement, CallExpression, Identifier, MemberExpression, StatementCommon, StructMethodAccessor, VariableDeclaration } from "./Parser";
import { Number } from "./Primitives/Number";
import { NativeFunction } from "./Struct/NativeFunction";
import { StructInstance } from "./Struct/StructInstance";
import { StructType } from "./Struct/StructType";

export class Interpreter {
    private code: string;

    constructor(code: string) {
        this.code = code
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

        console.warn(line);
        console.warn(`${" ".repeat(startIdx - lineStart)}${"^".repeat(endIdx - startIdx)}`);
        return err;
    }

    /**
     * Used for internal issues with the interpreter
     * @returns An Error Object
     */
    public internalError = (message: string): Error => {
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
            { type: "Number", func: this.number }
        ];
        const type = types.find(type => type.type == node.type);
        if (type == undefined) throw this.internalError(`Traverse function does not exist for type '${node.type}'`);

        // Rebind the function to the interpreter
        const result = await (type.func.bind(this)(node, ctx));
        return result;
    }
    //#endregion

    //#region Statements
    private blockStatement = async (node: BlockStatement, ctx: Context): Promise<[any, Context]> => {
        for (var i = 0; i < node.body.length; i++) {
            const statement = node.body[i];
            var [_, ctx] = await this.findTraverseFunc(statement, ctx);
            ctx.stack = []
        }

        return [null, ctx];
    }
    //#endregion

    //#region Variables
    private variableDeclaration = async (node: VariableDeclaration, ctx: Context): Promise<[any, Context]> => {
        var [init, ctx] = await this.findTraverseFunc(node.init, ctx);
        ctx.setSymbol(node.id, init);
        return [null, ctx];
    }

    private identifier = async (node: Identifier, ctx: Context): Promise<[any, Context]> => {
        const value = ctx.getSymbol<any>(node.value);
        if (value == undefined) throw this.runtimeErrorCode(`${node.value} does not exist in this current context`, node.start, node.end)
        return [value, ctx];
    }
    //#endregion

    //#region Functions
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
            var [value, ctx] = await callee.onCall(this, ctx, args);
            return [value, ctx];
        }

        throw this.internalError("Calling functions not yet implemented!");
    }
    //#endregion

    //#region Structs 
    private structMethodAccessor = async (node: StructMethodAccessor, ctx: Context): Promise<[any, Context]> => {
        var [struct, ctx]: [StructType, Context] = await this.findTraverseFunc(node.struct, ctx);
        const nativeFunc = struct.nativeMethods.find(method => method.id == node.method.value);

        // Push the struct to the stack so that it can be accessed in the nativeFunction
        ctx.stack.push(struct);

        return [nativeFunc, ctx];
    }

    private memberExpression = async (node: MemberExpression, ctx: Context): Promise<[any, Context]> => {
        var [object, ctx]: [StructInstance, Context] = await this.findTraverseFunc(node.object, ctx);
        const value = object.selfCtx.getSymbol(node.property.value);
        if (value == null) 
            throw this.runtimeErrorCode(`'${node.property.value}' does not exist on struct '${object.structType.id}'`, node.start, node.end);

        ctx.stack.push(object);
        return [value, ctx];
    }
    //#endregion

    //#region Primitives
    public number = async (node: { value: number }, ctx: Context): Promise<[any, Context]> => {
        const instance = new StructInstance(Number);
        instance.selfCtx.setProtected("value", node.value);
        return [instance, ctx];
    }
    //#endregion
}