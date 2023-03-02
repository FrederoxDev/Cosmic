import { Tokenize } from "./src/Lexer"
import { Parser } from "./src/Parser"
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs"
import { Interpreter } from "./src/Interpreter/Interpreter";
import { Context } from "./src/Interpreter/Context";
import { NumberStruct } from "./src/Interpreter/Structs/NumberStruct";
import { BooleanStruct } from "./src/Interpreter/Structs/BooleanStruct";
import { StringStruct } from "./src/Interpreter/Structs/StringStruct";
import { NativeFunction } from "./src/Interpreter/Primitives/NativeFunction";
import { StructRuntime } from "./src/Interpreter/Primitives/StructRuntime";
import { Struct } from "./src/Interpreter/Primitives/Struct";
import { ArrayStruct } from "./src/Interpreter/Structs/ArrayStruct";

if (!existsSync("./err")) mkdirSync("./err");
const input = readFileSync("./input.cos", { encoding: 'utf-8' });

/* Lexing */
const tokens = Tokenize(input);
writeFileSync('./err/tokens.json', JSON.stringify(tokens, null, 2), { flag: "w" });

// /* AST Parsing */
const [ast, parseError] = new Parser(tokens, input).parse();
if (parseError) {
    console.error(parseError);
    process.exit(1);
}
writeFileSync('./err/ast.json', JSON.stringify(ast, null, 2), { flag: "w" });

/* Interpreting */
console.log("Output:")
const globals = new Context(undefined)
globals.setVariable("Number", NumberStruct)
globals.setVariable("Boolean", BooleanStruct)
globals.setVariable("String", StringStruct)
globals.setVariable("Array", ArrayStruct)

globals.setVariable("log", new NativeFunction("log", async (interpreter, ctx, args) => {
    var out: string[] = [];

    for (var i = 0; i < args.length; i++) {
        const arg = await args[i];

        if (arg instanceof StructRuntime) {
            if (!arg.hasImplementedFunction("Inspect")) {
                out.push(arg?.inspect?.());
                continue;
            }
            const inspect = arg.getImplementedFunction("Inspect")

            if (inspect instanceof NativeFunction) {
                var [result, ctx] = await inspect.onCall(interpreter, ctx, arg);
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
            console.log("Log no inspect", await arg)
        }
    }

    console.log("\x1b[90m>\x1b[37m", ...out)
    return [null, ctx];
}))

new Interpreter(ast, input, globals).execute().then(result => {
    if (result instanceof Error) {
        console.error(result);
        process.exit(1);
    }
    
    console.log("\nFinished running with 0 errors!\n")
})