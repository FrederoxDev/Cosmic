import { RuntimeError } from "../Common/GenericError.ts";
import { Err, Ok, Result } from "../Common/Result.ts";
import { AstNode } from "../Parser/Common.ts";
import { PositionInfo } from "./PositionInfo.ts";

export abstract class Type {
    abstract name: string;
    info: PositionInfo;

    constructor(info: PositionInfo) {
        this.info = info;
    }

    protected runtimeError(reason: string): RuntimeError {
        return {
            isErrorCritical: true,
            reason: reason,
            start: this.info.start,
            end: this.info.end,
            type: "RuntimeError"
        }
    }

    rhsNotImplemented(rhs: Type, operator: string) {
        return Err(this.runtimeError(`'${this.name}' does not implement 'operator${operator}' for '${rhs.name}'`));
    }

    operatorNotImplemented(operator: string) {
        return Err(this.runtimeError(`'${this.name}' does not implement 'operator${operator}'`))
    }

    add(rhs: Type): Result<unknown, RuntimeError> {
        return this.operatorNotImplemented("+");
    }

    sub(rhs: Type): Result<unknown, RuntimeError> {
        return this.operatorNotImplemented("-");
    }

    div(rhs: Type): Result<unknown, RuntimeError> {
        return this.operatorNotImplemented("/");
    }

    mul(rhs: Type): Result<unknown, RuntimeError> {
        return this.operatorNotImplemented("*");
    }

    gt(rhs: Type): Result<unknown, RuntimeError> {
        return this.operatorNotImplemented(">");
    }

    gte(rhs: Type): Result<unknown, RuntimeError> {
        return this.operatorNotImplemented(">=");
    }

    lt(rhs: Type): Result<unknown, RuntimeError> {
        return this.operatorNotImplemented("<");
    }

    lte(rhs: Type): Result<unknown, RuntimeError> {
        return this.operatorNotImplemented("<=");
    }

    ee(rhs: Type): Result<unknown, RuntimeError> {
        return this.operatorNotImplemented("==");
    }

    ne(rhs: Type): Result<unknown, RuntimeError> {
        return this.operatorNotImplemented("!=");
    }

    not(operator: PositionInfo) {
        return this.operatorNotImplemented("!");
    }
}