import { AstNode, BinOpNode, ExprStmt, NumberNode, PrintStmt, ProgramNode, SymbolNode, UnionNode } from "./Parser/Common.ts";


type NodeInterpreter = (node: AstNode) => unknown;

const interpreters: {[key in UnionNode['type']]: NodeInterpreter} = {
    NumberNode: interpretNumberNode as NodeInterpreter,
    StringNode: interpretNotImplemented as NodeInterpreter,
    BooleanNode: interpretNotImplemented as NodeInterpreter,
    SymbolNode: interpretNotImplemented as NodeInterpreter,
    BinOpNode: interpretBinOpNode as NodeInterpreter,
    Program: interpretProgramNode as NodeInterpreter,
    ExprStmt: interpretExprStmt as NodeInterpreter,
    PrintStmt: interpretPrintStmt as NodeInterpreter
}

function interpretNotImplemented(node: AstNode) {
    throw new Error("No interpreter for: " + node.type)
} 

function interpretNumberNode(node: NumberNode) {
    return parseFloat(node.value);
}

function interpretBinOpNode(node: BinOpNode) {
    const lhs = interpret(node.lhs) as number;
    const rhs = interpret(node.rhs) as number;

    switch ((node.op as SymbolNode).value) {
        case "+":
            return lhs + rhs;

        case "-":
            return lhs - rhs;

        case "*":
            return lhs * rhs;

        case "/":
            return lhs / rhs;
    }
}

function interpretProgramNode(node: ProgramNode) {
    const declarations = node.declarations;

    for (let i = 0; i < declarations.length; i++) {
        interpret(declarations[i]);
    }
}

function interpretPrintStmt(node: PrintStmt) {
    console.log(interpret(node.expr));
}

export function interpretExprStmt(node: ExprStmt) {
    return interpret(node.expr);
}

export function interpret(ast: AstNode) {
    const interpreter = interpreters[ast.type as keyof typeof interpreters] ?? interpretNotImplemented(ast);
    return interpreter(ast);
}