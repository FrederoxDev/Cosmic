import { Tokenize } from "./Lexer/Lexer.js"
import { Parser } from "./Parser/parser.js"
import { Interpreter } from "./Interpreter/Interpreter.js";
import { Number, Boolean, String } from "./Interpreter/Primitives/index.js";

const testResult = (input, expected) => {
    const tokens = Tokenize(input)
    const ast = new Parser(tokens).expression();
    const result = new Interpreter(ast).executeFromStart()

    if (result.EE(expected)) {
        return true
    }

    else {
        console.log("\x1b[31m" + `Failed: "${input}" -> ${result.value}, expected ${expected.value}` + "\x1b[37m")
        return false
    }
}

const bulkTests = (name, tests) => {
    let failureCount = 0;

    tests.map(test => {
        const success = testResult(test[0], test[1]);
        if (!success) failureCount++;
    })

    if (failureCount == 0) {
        console.log("\x1b[32m" + `${name}: ${failureCount} / ${tests.length} failed!` + "\x1b[37m")
    }
    else console.log("\x1b[31m" + `${name}: ${failureCount} / ${tests.length} failed!` + "\x1b[37m")

    console.log("\n")
}

const orderTests = [
    ["3 * 4 + 5", new Number(17)],
    ["10 / (5 + 5)", new Number(1)],
    ["2 + 3 * 4", new Number(14)],
    ["3 - 5 * 2 + 8 / 4", new Number(-5)],
    ["4 * (5 - 2) + 6 / 2", new Number(15)],
]

bulkTests("Order of operations", orderTests)