import { Tokenize } from "./src/Lexer"
import { Parser, StatementCommon } from "./src/Parser"
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs"
import { Interpreter } from "./src/Interpreter";
import { Context } from "./src/Context";
import { StructType } from "./src/Struct/StructType";
import { NativeFunction } from "./src/Struct/NativeFunction";
import { StructInstance } from "./src/Struct/StructInstance";
import { NativeEnum } from "./src/Struct/NativeEnum";
import { getNumberLiteral } from "./src/Primitives/Number"
import { getStringLiteral } from "./src/Primitives/String"
// import { Interpreter } from "./src/Interpreter/Interpreter";
// import { Context } from "./src/Interpreter/Context";
// import { NumberStruct } from "./src/Interpreter/Structs/NumberStruct";
// import { BooleanStruct } from "./src/Interpreter/Structs/BooleanStruct";
// import { StringStruct } from "./src/Interpreter/Structs/StringStruct";
// import { NativeFunction } from "./src/Interpreter/Primitives/NativeFunction";
// import { StructRuntime } from "./src/Interpreter/Primitives/StructRuntime";
// import { Struct } from "./src/Interpreter/Primitives/Struct";
// import { ArrayStruct } from "./src/Interpreter/Structs/ArrayStruct";

const logError = (code: string, message: string, startIdx: number, endIdx: number) => {
    const lineStart = code.lastIndexOf("\n", startIdx) + 1;
    const line = code.substring(lineStart, endIdx);
    const lineNum = code.substring(0, startIdx).split("\n").length;
    const colNum = startIdx - lineStart + 1;

    console.warn(`${lineNum} | ` + line);
    console.warn(`${" ".repeat(lineNum.toString().length + 3)}` + `${" ".repeat(startIdx - lineStart)}${"^".repeat(endIdx - startIdx)}`);
    console.warn(message)
}

if (!existsSync("./err")) mkdirSync("./err");
console.time("read-file")
const input = readFileSync("./input.cos", { encoding: 'utf-8' });
console.timeEnd("read-file")

/* Lexing */
console.time("tokenize-file")
const tokens = Tokenize(input);
console.timeEnd("tokenize-file")
writeFileSync('./err/tokens.json', JSON.stringify(tokens, null, 2), { flag: "w" });
if (!Array.isArray(tokens)) {
    logError(input, `${tokens.type}: ${tokens.message}`, tokens.start, tokens.end);
    process.exit(1)
}

// /* AST Parsing */
console.time("parse-tokens")
const parser = new Parser(tokens, input);
const [ast, parseError]: any = parser.parse();
console.timeEnd("parse-tokens")
if (parseError) {
    logError(input, parser.errMessage, parser.errStart, parser.errEnd);
    process.exit(1);
}
writeFileSync('./err/ast.json', JSON.stringify(ast, null, 2), { flag: "w" });

const Vec3 = new StructType("Vec3", [
    { name: "x", type: "Number" },
    { name: "y", type: "Number" },
    { name: "z", type: "Number" },
], [
    new NativeFunction("From", async (interpreter, context, start, end, args): Promise<[any, Context]> => {
        const instance = new StructInstance(Vec3);
        instance.selfCtx.setSymbol("x", args[0]);
        instance.selfCtx.setSymbol("y", args[1]);
        instance.selfCtx.setSymbol("z", args[2]);

        return [instance, context];
    }),

    new NativeFunction("ToString", async (interpreter, context, start, end, args): Promise<[any, Context]> => {
        var selfRef = context.stack.pop() as StructInstance;
        const x = getNumberLiteral(selfRef.selfCtx.getSymbol("x"));
        const y = getNumberLiteral(selfRef.selfCtx.getSymbol("y"));
        const z = getNumberLiteral(selfRef.selfCtx.getSymbol("z"));
        return interpreter.string({ value: `(${x}, ${y}, ${z})` }, context);
    }),

    new NativeFunction("Modify", async (interpreter, context, start, end, args): Promise<[any, Context]> => {
        var selfRef = context.stack.pop() as StructInstance;
        if (!(selfRef instanceof StructInstance)) throw Interpreter.internalError("Modify can only be ran on an instance of a Vec3")

        var [val, context] = await interpreter.number({ value: 3 }, context);

        selfRef.selfCtx.setSymbol("x", val);
        selfRef.selfCtx.setSymbol("y", val);
        selfRef.selfCtx.setSymbol("z", val);

        return [null, context];
    })
]);

const Status = new NativeEnum("Status", ["Ok", "Err"])

/* Interpreting */
const globals = new Context()

globals.setMethod("log", new NativeFunction("log", async (interpreter, ctx: Context, start, end, args) => {
    const stringArgs: string[] = []

    for (var i = 0; i < args.length; i++) {
        const arg = args[i]
        if (arg instanceof NativeFunction) {
            stringArgs.push(`[NativeFunction ${arg.id}]`);
            continue;
        }

        // Catch case if its trying to print something that isnt a struct
        if (!(arg instanceof StructInstance)) {
            stringArgs.push(`[Unknown: ${args[i].constructor.type}]`)
            continue;
        }

        // The Struct Implements ToString so print out the stringified version
        if (arg.hasImplementedMethod("ToString")) {
            const func = arg.getImplementedMethod("ToString");
            ctx.stack.push(arg)
            var [value, ctx]: [StructInstance, Context] = await func.onCall(interpreter, ctx, start, end, []);
            
            if (value.structType.id !== "String") throw interpreter.runtimeErrorCode(
                `Struct '${arg.structType.id}' implements 'ToString', which is expected to return type String, instead got ${value.structType.id}`,
                start,
                end
            )

            stringArgs.push(getStringLiteral(value));
            continue;
        }

        stringArgs.push(`[Struct ${arg.structType.id}]`);
    }
    console.log(">", ...stringArgs)

    return [null, ctx];
}))

const interpreter = new Interpreter(input, [Vec3], [Status]);

console.time("execute-program")
interpreter.findTraverseFunc(ast, globals).catch(e => {
    console.log(e)
    logError(input, interpreter.errMessage, interpreter.errStart, interpreter.errEnd)
}).finally(() => {
    console.timeEnd("execute-program")
})
