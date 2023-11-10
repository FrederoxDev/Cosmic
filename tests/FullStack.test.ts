// import { assertEquals } from "https://deno.land/std@0.194.0/testing/asserts.ts";
// import { parseToTokens } from "../src/Lexer.ts";
// import { tokensToAST, ruleSet } from "../src/Parser.ts";
// import { interpret } from "../src/Interpreter.ts";

// function evaluateExpr(expression: string) {
//     const tokens = parseToTokens(expression, false)
//     if (!tokens.isOk) throw new Error(`Failed to parse ${expression} into tokens`);

//     const expr = ruleSet.getRule("declaration").matches(ruleSet, tokens.unwrap());
//     if (!expr.isOk) throw new Error(`Failed to parse ${expression} into expr`);

//     return interpret(expr.unwrap());
// }

// Deno.test('order of operations - Addition and Multiplication', () => {
//     assertEquals(evaluateExpr("1 + 2 * 3;"), 7);
// });

// Deno.test('order of operations - Subtraction and Division', () => {
//     assertEquals(evaluateExpr("6 / 2 - 1;"), 2);
// });

// Deno.test('order of operations - Combination of Operators', () => {
//     assertEquals(evaluateExpr("2 + 3 * 4 - 5 / 1;"), 9);
// });

// Deno.test('order of operations - Parentheses', () => {
//     assertEquals(evaluateExpr("(2 + 3) * (4 - 5);"), -5);
// });

// Deno.test('order of operations - Nested Parentheses', () => {
//     assertEquals(evaluateExpr("((2 + 3) * 4) - (5 / 1);"), 15);
// });

// Deno.test('order of operations - Operator Precedence', () => {
//     assertEquals(evaluateExpr("2 + 3 - 4 * 5 / 2;"), -5);
// });

// Deno.test('order of operations - Complex Expression', () => {
//     assertEquals(evaluateExpr("(2 + 3) * (4 - 5) / 2 + 6;"), 3.5);
// });