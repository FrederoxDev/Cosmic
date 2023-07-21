import { bold, dim, magenta, red } from "https://deno.land/std@0.194.0/fmt/colors.ts";
import { CosmicError } from "./Common/GenericError.ts";
import { parseToTokens } from "./Lexer.ts";
import { tokensToAST } from "./Parser.ts";
import { interpret } from "./Interpreter.ts";

const input = Deno.readTextFileSync("./input.cos");

function reportIssue(type: string, message: string, start: number, end: number) {
    const lineNumber = (input.substring(0, start).match(/\n/g) || []).length;

    // Color the issue brighter and display either sides of the line
    const beforeIssue = input.slice(0, start).split("\n").pop() ?? "";
    const issue = input.slice(start, end);
    const afterIssue = input.slice(end).split("\n").shift() ?? "";

    // Points towards the issue and provides the error text
    const arrow = " ".repeat(beforeIssue.length) + "^".repeat(Math.max(1, end - start)) + " " + message;

    // Line Numbers
    const linePrefix = magenta(bold(" ".repeat((lineNumber + 1).toString().length) + " | "));
    const numberedLinePrefix = magenta(bold(`${lineNumber + 1} | `));

    // Display Issue type
    const issueType = bold(red("error: ") + type);
    const fileNameArrow = bold(magenta("-->"))

    // Dump everything to console
    console.log(issueType);
    console.log(`${fileNameArrow} input.cos:${lineNumber + 1}:${beforeIssue.length + 1}`);
    console.log(linePrefix);
    console.log(numberedLinePrefix + dim(beforeIssue) + issue + dim(afterIssue));
    console.log(linePrefix + bold(red(arrow)));
    console.log("")
}

const tokens = parseToTokens(input, true);
if (!tokens.isOk) {
    const errors = tokens.unwrapErr() as CosmicError[];

    errors.forEach(err => {
        reportIssue(err.type, err.reason, err.start, err.end);
    })

    Deno.exit(1)
}

const ast = tokensToAST(tokens.unwrap(), true, false, true);
if (!ast.isOk) {
    const error = ast.unwrapErr() as CosmicError;
    reportIssue(error.type, error.reason, error.start, error.end);
    console.log("critical:", error.isErrorCritical)
}

const interpretedRes = interpret(ast.unwrap());