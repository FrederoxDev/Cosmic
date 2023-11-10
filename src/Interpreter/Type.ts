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

    runtimeError(reason: string): RuntimeError {
        return {
            isErrorCritical: true,
            reason: reason,
            start: this.info.start,
            end: this.info.end,
            type: "RuntimeError"
        }
    }

    add(rhs: Type): Result<unknown, RuntimeError> {
        return Err(this.runtimeError(`${this.name} does not implement operator +`));
    }

    sub(rhs: Type): Result<unknown, RuntimeError> {
        return Err(this.runtimeError(`${this.name} does not implement operator -`));
    }

    div(rhs: Type): Result<unknown, RuntimeError> {
        return Err(this.runtimeError(`${this.name} does not implement operator /`));
    }

    mul(rhs: Type): Result<unknown, RuntimeError> {
        return Err(this.runtimeError(`${this.name} does not implement operator *`));
    }

    gt(rhs: Type): Result<unknown, RuntimeError> {
        return Err(this.runtimeError(`${this.name} does not implement operator >`));
    }

    gte(rhs: Type): Result<unknown, RuntimeError> {
        return Err(this.runtimeError(`${this.name} does not implement operator >=`));
    }

    lt(rhs: Type): Result<unknown, RuntimeError> {
        return Err(this.runtimeError(`${this.name} does not implement operator <`));
    }

    lte(rhs: Type): Result<unknown, RuntimeError> {
        return Err(this.runtimeError(`${this.name} does not implement operator <=`));
    }

    ee(rhs: Type): Result<unknown, RuntimeError> {
        return Err(this.runtimeError(`${this.name} does not implement operator ==`));
    }

    ne(rhs: Type): Result<unknown, RuntimeError> {
        return Err(this.runtimeError(`${this.name} does not implement operator !=`));
    }
}