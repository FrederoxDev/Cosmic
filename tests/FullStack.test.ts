import { assertEquals } from "https://deno.land/std@0.194.0/testing/asserts.ts";
import { parseToTokens } from "../src/Lexer.ts";
import { tokensToAST, ruleSet } from "../src/Parser.ts";
import { interpret } from "../src/Interpreter.ts";

function evaluate(expression: string) {
    const tokens = parseToTokens(expression, false)
    if (!tokens.isOk) throw new Error(`Failed to parse ${expression} into tokens`);

    const expr = ruleSet.getRule("declaration").matches(ruleSet, tokens.unwrap());
    if (!expr.isOk) throw new Error(`Failed to parse ${expression} into expr`);

    return interpret(expr.unwrap());
}

Deno.test('order of operations - Addition and Multiplication', () => {
    assertEquals(evaluate("1 + 2 * 3;"), 7);
});

Deno.test('order of operations - Subtraction and Division', () => {
    assertEquals(evaluate("6 / 2 - 1;"), 2);
});

Deno.test('order of operations - Combination of Operators', () => {
    assertEquals(evaluate("2 + 3 * 4 - 5 / 1;"), 9);
});

Deno.test('order of operations - Parentheses', () => {
    assertEquals(evaluate("(2 + 3) * (4 - 5);"), -5);
});

Deno.test('order of operations - Nested Parentheses', () => {
    assertEquals(evaluate("((2 + 3) * 4) - (5 / 1);"), 15);
});

Deno.test('order of operations - Operator Precedence', () => {
    assertEquals(evaluate("2 + 3 - 4 * 5 / 2;"), -5);
});

Deno.test('order of operations - Complex Expression', () => {
    assertEquals(evaluate("(2 + 3) * (4 - 5) / 2 + 6;"), 3.5);
});