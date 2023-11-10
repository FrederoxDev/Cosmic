import { Err } from "../Common/Result.ts";
import { interpret } from "../Interpreter.ts";
import { AstNode, BinOpNode, PrintStmtNode, ProgramNode, NumberNode } from "../Parser/Common.ts";
import { Context } from "./Context.ts";
import { NumberType, Type } from "./Type.ts";

export abstract class Node<T extends AstNode> {
    visit(node: T, context: Context): unknown {
        throw new Error(`${node.type} does not implement visit!`);
    }
}

export class Program extends Node<ProgramNode> {
    visit(node: ProgramNode, context: Context): unknown {
        const declarations = node.declarations;

        for (let i = 0; i < declarations.length; i++) {
            interpret(declarations[i], context);
        }

        return undefined;
    }
}

export class PrintStmt extends Node<PrintStmtNode> {
    visit(node: PrintStmtNode, context: Context): unknown {
        const value = interpret(node.expr, context);
        console.log(value);

        return undefined;
    }
}

export class BinOp extends Node<BinOpNode> {
    visit(node: BinOpNode, context: Context): unknown {
        const lhs = interpret(node.lhs, context) as Type;
        const rhs = interpret(node.rhs, context) as Type;

        if (node.op.value == "+") return lhs.add(rhs);
        else if (node.op.value == "-") return lhs.sub(rhs);
        else if (node.op.value == "*") return lhs.mul(rhs);
        else if (node.op.value == "/") return lhs.div(rhs);

        throw new Error(`BinOp does not implement operator '${node.op.value}'`)
    }
}

export class Number extends Node<NumberNode> {
    visit(node: NumberNode, context: Context): unknown {
        return new NumberType(node.value);
    }
}