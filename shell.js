import { Tokenize } from "./Lexer/Lexer.js"
import { Parser } from "./Parser/parser.js"
import { Interpreter } from "./Interpreter/Interpreter.js";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs"

if (!existsSync("./err")) mkdirSync("./err");
const input = readFileSync("./input.cos", { encoding: 'utf-8' });

/* Lexing */
const tokens = Tokenize(input);
writeFileSync('./err/tokens.json', JSON.stringify(tokens, null, 2), { flag: "w" });

/* AST Parsing */
const [ast, parseError] = new Parser(tokens, input).parse();
if (parseError) {
    console.error(parseError);
    process.exit(1);
}
writeFileSync('./err/ast.json', JSON.stringify(ast, null, 2), { flag: "w" });

/* Interpreting */
console.log("Output:")
const [result, runtimeError] = new Interpreter(ast).executeFromStart();
if (runtimeError) {
    console.error(runtimeError);
    process.exit(1);
}

console.log("\nFinished running with 0 errors!")