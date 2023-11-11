import { Context } from "./Interpreter/Context.ts";
import { AstNode } from "./Parser/Common.ts";
import { BinOp, Node, PrintStmt, Program, Number, String, Boolean, UnaryOp } from "./Interpreter/Node.ts";
import { Result } from "./Common/Result.ts";
import { RuntimeError } from "./Common/GenericError.ts";

const interpreters: {[key: string]: new() => Node<AstNode>} = {
    ProgramNode: Program,
    PrintStmtNode: PrintStmt,
    BinOpNode: BinOp,
    UnaryOpNode: UnaryOp,
    NumberNode: Number,
    StringNode: String,
    BooleanNode: Boolean
}

export function interpret(ast: AstNode, context: Context): Result<unknown, RuntimeError> {
    const interpreter = interpreters[ast.type];

    if (interpreter === undefined) {
        throw new Error(`Node type: '${ast.type}' is not supported yet!`)        
    }

    return new interpreter().visit(ast, context);
}