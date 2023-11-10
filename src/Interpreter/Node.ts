import { RuntimeError } from "../Common/GenericError.ts";
import { Err, Ok, Result } from "../Common/Result.ts";
import { interpret } from "../Interpreter.ts";
import { AstNode, BinOpNode, PrintStmtNode, ProgramNode, NumberNode, StringNode } from "../Parser/Common.ts";
import { Context } from "./Context.ts";
import { PositionInfo } from "./PositionInfo.ts";
import { Type } from "./Type.ts";
import { NumberType } from "./Types/NumberType.ts";
import { StringType } from "./Types/StringType.ts";

export abstract class Node<T extends AstNode> {
    visit(node: T, context: Context): Result<unknown, RuntimeError> {
        throw new Error(`${node.type} does not implement visit!`);
    }
}

export class Program extends Node<ProgramNode> {
    visit(node: ProgramNode, context: Context): Result<unknown, RuntimeError> {
        const declarations = node.declarations;

        for (let i = 0; i < declarations.length; i++) {
            const res = interpret(declarations[i], context);
            if (!res.isOk) return res;
        }

        return Ok(undefined);
    }
}

export class PrintStmt extends Node<PrintStmtNode> {
    visit(node: PrintStmtNode, context: Context): Result<unknown, RuntimeError> {
        const value = interpret(node.expr, context);
        if (!value.isOk) return value;

        console.log(value.unwrap());

        return Ok(undefined);
    }
}

export class BinOp extends Node<BinOpNode> {
    visit(node: BinOpNode, context: Context): Result<unknown, RuntimeError> {
        const lhs = interpret(node.lhs, context) as Result<Type, RuntimeError>;
        if (!lhs.isOk) return lhs;

        const rhs = interpret(node.rhs, context) as Result<Type, RuntimeError>;
        if (!rhs.isOk) return rhs;

        if (node.op.value == "+") return lhs.unwrap().add(rhs.unwrap());
        if (node.op.value == "-") return lhs.unwrap().sub(rhs.unwrap());
        if (node.op.value == "*") return lhs.unwrap().mul(rhs.unwrap());
        if (node.op.value == "/") return lhs.unwrap().div(rhs.unwrap());
        if (node.op.value == ">") return lhs.unwrap().gt(rhs.unwrap());
        if (node.op.value == ">=") return lhs.unwrap().gte(rhs.unwrap());
        if (node.op.value == "<") return lhs.unwrap().lt(rhs.unwrap());
        if (node.op.value == "<=") return lhs.unwrap().lte(rhs.unwrap());
        if (node.op.value == "==") return lhs.unwrap().ee(rhs.unwrap());
        if (node.op.value == "!=") return lhs.unwrap().ne(rhs.unwrap());

        throw new Error(`BinOp does not implement operator '${node.op.value}'`);
    }
}

export class Number extends Node<NumberNode> {
    visit(node: NumberNode, context: Context): Result<unknown, RuntimeError> {
        const info = new PositionInfo(node.start, node.end);
        return Ok(new NumberType(info, node.value));
    }
}

export class String extends Node<StringNode> {
    visit(node: StringNode, context: Context): Result<unknown, RuntimeError> {
        const info = new PositionInfo(node.start, node.end);
        return Ok(new StringType(info, node.value));
    }
}