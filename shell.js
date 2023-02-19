import { Tokenize } from "./Lexer/Lexer.js"
import { Parser } from "./Parser/parser.js"
import { Interpreter } from "./Interpreter/Interpreter.js";
import { existsSync, mkdirSync, writeFileSync } from "fs"

const input = `
let name = "Freddie";
let password = "right";

log(name == "Freddie" && password == "right");
if (name == "Freddie" && password == "right") {
    log("Access Granted!");
}

log(name != "Freddie");
if (name != "Freddie") {
    log("Go away!");
}

log(name == "Freddie" && password != "right");
if (name == "Freddie" && password != "right") {
    log("Wrong Password");
}
`

const tokens = Tokenize(input);
const tokensCopy = tokens.slice();
const ast = new Parser(tokens).statements();

console.log("Executing Code:" + "\x1b[90m")
console.log(input.trim());
console.log("\x1b[37m")

if (!existsSync("./err")) mkdirSync("./err");
writeFileSync('./err/ast.json', JSON.stringify(ast, null, 2), { flag: "w" });
writeFileSync('./err/tokens.json', JSON.stringify(tokensCopy, null, 2), { flag: "w" });

try {
    console.log("Output:")
    const out = new Interpreter(ast).executeFromStart()
    if (out != undefined) {
        console.log(">\x1b[90m", out.toString(), "\x1b[37m");
    }

    console.log("\nFinished running with 0 errors!")
}

catch (e) {
    console.log("Runtime Errors:")
    console.error(e)

    writeFileSync('./err/err_log.txt', e.toString(), { flag: "w" });
}