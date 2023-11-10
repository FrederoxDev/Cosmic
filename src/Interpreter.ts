import { Context } from "./Interpreter/Context.ts";
import { AstNode } from "./Parser/Common.ts";
import { BinOp, Node, PrintStmt, Program, Number } from "./Interpreter/Node.ts";

const interpreters: {[key: string]: new() => Node<AstNode>} = {
    ProgramNode: Program,
    PrintStmtNode: PrintStmt,
    BinOpNode: BinOp,
    NumberNode: Number
}

export function interpret(ast: AstNode, context: Context): unknown {
    const interpreter = interpreters[ast.type];

    if (interpreter === undefined) {
        throw new Error(`Node type: '${ast.type}' is not supported yet!`)        
    }

    return new interpreter().visit(ast, context);
}