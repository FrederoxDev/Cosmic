// import { AstNode, BinOpNode, ExprStmtNode, NumberNode, PrintStmtNode, ProgramNode, SymbolNode } from "../Parser/Common.ts"
// import { interpret } from "../Interpreter.ts";

// export abstract class Node<T extends AstNode> {
//     visit(node: T): unknown {
//         throw new Error(`'${node.type}' does not implement visit`);
//     }
// }

// export class Program extends Node<ProgramNode> {
//     visit(node: ProgramNode): unknown {
//         const declarations = node.declarations;

//         for (let i = 0; i < declarations.length; i++) {
//             interpret(declarations[i]);
//         }

//         return undefined;
//     }
// }

// export class PrintStmt extends Node<PrintStmtNode> {
//     visit(node: PrintStmtNode): unknown {
//         console.log(interpret(node.expr));
//         return undefined;
//     }
// }

// export class ExprStmt extends Node<ExprStmtNode> {
//     visit(node: ExprStmtNode): unknown {
//         return interpret(node.expr);
//     }
// }

// export class BinOp extends Node<BinOpNode> {
//     visit(node: BinOpNode): unknown {
//         const lhs = interpret(node.lhs) as number;
//         const rhs = interpret(node.rhs) as number;
        
//         switch ((node.op as SymbolNode).value) {
//             case "+":
//                 return lhs + rhs;

//             case "-":
//                 return lhs - rhs;

//             case "*":
//                 return lhs * rhs;

//             case "/":
//                 return lhs / rhs;
//         }
//     }
// }