import { Context } from "../Context";
import { Interpreter } from "../Interpreter";
import { Literal } from "../Primitives/Literal";
import { StructRuntime } from "../Primitives/StructRuntime";


export const parseBinaryArgs = <X, Y>(args: any[]): [X, Y] => {
    const lhs = args[0] as StructRuntime;
    const rhs = args[1] as StructRuntime;

    const left = getLiteralValue<X>(lhs).value;
    const right = getLiteralValue<Y>(rhs).value;
    return [left, right]
}

/**
 * Returns the literal value of a type
 * @throws Will throw if type is not expectedType
 */
export const parseBinaryArgsAssertType = <T>(interpreter: Interpreter, args: any[], expectedType: string, operator: string): [T, T] => {    
    const lhs = interpreter.assertType(expectedType, operator, args[0] as StructRuntime);
    const rhs = interpreter.assertType(expectedType, operator, args[1] as StructRuntime);

    const left = getLiteralValue<T>(lhs).value;
    const right = getLiteralValue<T>(rhs).value;
    return [left, right]
}

export const parseBinaryTypes = (args: any[]): [string, string] => {
    return [
        (args[0] as StructRuntime).struct.id, 
        (args[1] as StructRuntime).struct.id
    ]
}

export const getLiteralValue = <T>(struct: StructRuntime): Literal<T> => {
    return struct.selfCtx.getVariable("value") as Literal<T>;
}