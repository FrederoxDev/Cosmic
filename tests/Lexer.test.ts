import { assertEquals } from "https://deno.land/std@0.194.0/testing/asserts.ts";
import { parseToTokens } from "../src/Lexer.ts";

Deno.test('numberLiteral int', () => {
    const tokens = parseToTokens(`1`, false).unwrap();
    assertEquals(tokens, [
        { type: "NumberLiteral", value: "1", start: 0, end: 1 },
        { type: "EndOfFile", value: undefined, start: 2, end: 2 }
    ])
});

Deno.test('numberLiteral float', () => {
    const tokens = parseToTokens(`2.5`, false).unwrap();
    assertEquals(tokens, [
        { type: "NumberLiteral", value: "2.5", start: 0, end: 3 },
        { type: "EndOfFile", value: undefined, start: 4, end: 4 }
    ])
});

Deno.test('stringLiteral', () => {
    const tokens = parseToTokens(`"hello"`, false).unwrap();
    assertEquals(tokens, [
        { type: "StringLiteral", value: `"hello"`, start: 0, end: 7 },
        { type: "EndOfFile", value: undefined, start: 8, end: 8 }
    ])
});

Deno.test('booleanLiteral', () => {
    const tokens = parseToTokens(`true`, false).unwrap();
    assertEquals(tokens, [
        { type: "BooleanLiteral", value: "true", start: 0, end: 4 },
        { type: "EndOfFile", value: undefined, start: 5, end: 5 }
    ])
})

Deno.test('symbols', () => {
    const tokens = parseToTokens(`> >=`, false).unwrap();
    assertEquals(tokens, [
        { type: "Symbol", value: ">", start: 0, end: 1 },
        { type: "Symbol", value: ">=", start: 2, end: 4 },
        { type: "EndOfFile", value: undefined, start: 5, end: 5 }
    ])
})

Deno.test('empty', () => {
    const tokens = parseToTokens(``, false).unwrap();
    assertEquals(tokens, [
        { type: "EndOfFile", value: undefined, start: 1, end: 1 }
    ])
})

Deno.test('illegal character', () => {
    const tokens = parseToTokens(`$`,false).unwrapErr();
    assertEquals(1, tokens.length, "Only expected one error");
    
    assertEquals("Illegal Character: '$'", tokens[0].reason)
    assertEquals(0, tokens[0].start)
    assertEquals(1, tokens[0].end)
})