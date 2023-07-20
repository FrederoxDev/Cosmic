import { assertEquals } from "https://deno.land/std@0.194.0/testing/asserts.ts";
import { parseToTokens } from "../src/Lexer.ts";
import { tokensToAST } from "../src/Parser.ts";
import { AstNode, BinOpNode, BooleanNode, NumberNode } from "../src/Parser/Common.ts";

// deno-lint-ignore no-explicit-any
const replacer = (key: any, value: any) => {
    if (["start", "end"].includes(key)) return undefined;
    return value;
}

const removePositionData = (ast: AstNode): Omit<AstNode, "start" | "end"> => {
    return JSON.parse(JSON.stringify(ast, replacer, undefined));
}

Deno.test('numberLiteral int', () => {
    const tokens = parseToTokens(`1`, false).unwrap();
    const ast = removePositionData(tokensToAST(tokens, false, false, false).unwrap());

    assertEquals(ast as unknown, {
        type: "NumberNode",
        value: "1"
    })
});

Deno.test('numberLiteral float', () => {
    const tokens = parseToTokens(`2.6`, false).unwrap();
    const ast = removePositionData(tokensToAST(tokens, false, false, false).unwrap());

    assertEquals(ast as unknown, {
        type: "NumberNode",
        value: "2.6"
    })
});

Deno.test('booleanLiteral', () => {
    const tokens = parseToTokens(`true`, false).unwrap();
    const ast = removePositionData(tokensToAST(tokens, false, false, false).unwrap());

    assertEquals(ast as unknown, {
        type: "BooleanNode",
        value: "true"
    })
});

Deno.test('addition', () => {
    const tokens = parseToTokens(`1 + 1`, false).unwrap();
    const ast = removePositionData(tokensToAST(tokens, false, false, false).unwrap());

    assertEquals(ast as unknown, {
        type: "BinOpNode",
        lhs: {
            type: "NumberNode",
            value: "1"
        },
        op: "+",
        rhs: {
            type: "NumberNode",
            value: "1"
        }
    })
});

Deno.test('order of operation 1', () => {
    const tokens = parseToTokens(`1 + 2 * 3`, false).unwrap();
    const ast = removePositionData(tokensToAST(tokens, false, false, false).unwrap());

    assertEquals(ast as unknown, {
        type: "BinOpNode",
        lhs: {
            type: "NumberNode",
            value: "1"
        },
        op: "+",
        rhs: {
            type: "BinOpNode",
            lhs: {
                type: "NumberNode",
                value: "2"
            },
            op: "*",
            rhs: {
                type: "NumberNode",
                value: "3"
            }
        }
    })
});

Deno.test('order of operation 2', () => {
    const tokens = parseToTokens(`1 + 2 * 3 + 1`, false).unwrap();
    const ast = removePositionData(tokensToAST(tokens, false, false, false).unwrap());

    assertEquals(ast as unknown, {
        "type": "BinOpNode",
        "lhs": {
            "type": "BinOpNode",
            "lhs": {
                "type": "NumberNode",
                "value": "1"
            },
            "op": "+",
            "rhs": {
                "type": "BinOpNode",
                "lhs": {
                    "type": "NumberNode",
                    "value": "2"
                },
                "op": "*",
                "rhs": {
                    "type": "NumberNode",
                    "value": "3"
                }
            }
        },
        "op": "+",
        "rhs": {
            "type": "NumberNode",
            "value": "1"
        }
    })
});

Deno.test('unexpected symbol', () => {
    const tokens = parseToTokens(`1 + 3 + /`, false).unwrap();
    const ast = tokensToAST(tokens, false, false, false).unwrapErr();

    assertEquals(`Expected type of 'NumberLiteral | StringLiteral | BooleanLiteral | "(" expression ")"' instead got 'Symbol'`, ast.reason);
    assertEquals(8, ast.start);
    assertEquals(9, ast.end)
});

Deno.test('unexpected end', () => {
    const tokens = parseToTokens(`1 + 3 +`, false).unwrap();
    const ast = tokensToAST(tokens, false, false, false).unwrapErr();

    assertEquals(`Expected type of 'NumberLiteral | StringLiteral | BooleanLiteral | "(" expression ")"' instead got 'EndOfFile'`, ast.reason);
    assertEquals(8, ast.start);
    assertEquals(8, ast.end)
});

Deno.test('grouping', () => {
    const tokens = parseToTokens(`(1 + 2) * 3`, false).unwrap();
    const ast = tokensToAST(tokens, false, false, false).unwrap();

    assertEquals(ast as unknown, {
        "type": "BinOpNode",
        "lhs": {
            "type": "BinOpNode",
            "lhs": {
                "type": "NumberNode",
                "value": "1",
                "start": 1,
                "end": 2
            },
            "op": "+",
            "rhs": {
                "type": "NumberNode",
                "value": "2",
                "start": 5,
                "end": 6
            },
            "start": 1,
            "end": 6
        },
        "op": "*",
        "rhs": {
            "type": "NumberNode",
            "value": "3",
            "start": 10,
            "end": 11
        },
        "start": 1,
        "end": 11
    })
});