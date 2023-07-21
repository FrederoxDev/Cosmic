import { AstNode, UnionNode } from "./Parser/Common.ts";
import { BinOp, ExprStmt, Node, PrintStmt, Program } from "./Interpreter/Visit.ts";
import { Boolean, Number, String } from "./Interpreter/Literals.ts";

type NodeTypes = UnionNode['type'];


const interpreters: {[key in NodeTypes]?: new () => Node<AstNode>} = {
    NumberNode: Number,
    StringNode: String,
    BooleanNode: Boolean,
    ProgramNode: Program,
    PrintStmtNode: PrintStmt,
    ExprStmtNode: ExprStmt,
    BinOpNode: BinOp
}

export function interpret(ast: AstNode) {
    const interpreter = interpreters[ast.type as keyof typeof interpreters];
    if (interpreter === undefined) 
        throw new Error(`Node type: '${ast.type}' is not supported yet!`)
    
    return new interpreter().visit(ast);
}