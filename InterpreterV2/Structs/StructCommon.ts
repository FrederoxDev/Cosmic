import { Context } from "../Context";
import { Interpreter } from "../Interpreter";
import { Literal } from "../Primitives/Literal";
import { StructRuntime } from "../Primitives/StructRuntime";

export const getRuntime = (args: any[]): [Interpreter, Context] => {
    return [
        args[0] as Interpreter,
        args[1] as Context
    ]
}

export const parseBinaryArgs = <X, Y>(args: any[]): [X, Y] => {
    const lhs = args[2] as StructRuntime;
    const rhs = args[3] as StructRuntime;

    const left = getLiteralValue<X>(lhs).value;
    const right = getLiteralValue<Y>(rhs).value;
    return [left, right]
}

export const parseBinaryArgsAssertType = <T>(args: any[], expectedType: string, operator: string): [T, T] => {
    const interpreter = args[0] as Interpreter
    const lhs = interpreter.assertType(expectedType, operator, args[2] as StructRuntime);
    const rhs = interpreter.assertType(expectedType, operator, args[3] as StructRuntime);

    const left = getLiteralValue<T>(lhs).value;
    const right = getLiteralValue<T>(rhs).value;
    return [left, right]
}

export const parseBinaryTypes = (args: any[]): [string, string] => {
    return [
        (args[2] as StructRuntime).struct.id, 
        (args[3] as StructRuntime).struct.id
    ]
}

export const getLiteralValue = <T>(struct: StructRuntime): Literal<T> => {
    return struct.selfCtx.getVariable("value") as Literal<T>;
}