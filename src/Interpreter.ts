import { AstNode, BinOpNode, NumberNode, UnionNode } from "./Parser/Common.ts";

// deno-lint-ignore no-explicit-any
type NodeInterpreter = (node: AstNode) => any;

const interpreters: {[key in UnionNode['type']]: NodeInterpreter} = {
    NumberNode: interpretNumberNode as NodeInterpreter,
    StringNode: interpretNotImplemented as NodeInterpreter,
    BooleanNode: interpretNotImplemented as NodeInterpreter,
    BinOpNode: interpretBinOpNode as NodeInterpreter,
}

function interpretNotImplemented(node: AstNode) {
    throw new Error("No interpreter for: " + node.type)
} 

function interpretNumberNode(node: NumberNode) {
    return parseFloat(node.value);
}

function interpretBinOpNode(node: BinOpNode) {
    switch (node.op) {
        case "+":
            return interpret(node.lhs) + interpret(node.rhs);

        case "-":
            return interpret(node.lhs) - interpret(node.rhs);

        case "*":
            return interpret(node.lhs) * interpret(node.rhs);

        case "/":
            return interpret(node.lhs) / interpret(node.rhs);
    }
}

export function interpret(ast: AstNode) {
    const interpreter = interpreters[ast.type as keyof typeof interpreters];
    return interpreter(ast);
}