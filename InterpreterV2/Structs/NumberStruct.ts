import { Context } from "../Context";
import { Interpreter } from "../Interpreter";
import { Literal } from "../Primitives/Literal";
import { NativeFunction } from "../Primitives/NativeFunction";
import { Struct } from "../Primitives/Struct";
import { StructRuntime } from "../Primitives/StructRuntime";
import { getLiteralValue, getRuntime, parseBinaryArgs, parseBinaryArgsAssertType, parseBinaryTypes } from "./StructCommon";

export const NumberStruct = new Struct("number", [{name: "value", type: "numberLiteral"}], [
    new NativeFunction("Add", (...args) => { 
        const [interpreter, ctx] = getRuntime(args)
        const [left, right] = parseBinaryArgsAssertType<number>(args, "number", "+");
        return interpreter.primitiveNumber({ value: left + right }, ctx)
    }),

    new NativeFunction("Minus", (...args) => { 
        const [interpreter, ctx] = getRuntime(args)
        const [left, right] = parseBinaryArgsAssertType<number>(args, "number", "-");
        return interpreter.primitiveNumber({ value: left - right }, ctx)
    }),

    new NativeFunction("Div", (...args) => { 
        const [interpreter, ctx] = getRuntime(args)
        const [left, right] = parseBinaryArgsAssertType<number>(args, "number", "/");
        if (right == 0) interpreter.runtimeError("Cannot divide by 0");

        return interpreter.primitiveNumber({ value: left / right }, ctx)
    }),

    new NativeFunction("Mul", (...args) => { 
        const [interpreter, ctx] = getRuntime(args)
        const [left, right] = parseBinaryArgsAssertType<number>(args, "number", "*");
        return interpreter.primitiveNumber({ value: left * right }, ctx)
    }),

    new NativeFunction("EE", (...args) => { 
        const [interpreter, ctx] = getRuntime(args);
        const [leftType, rightType] = parseBinaryTypes(args);

        if (leftType != rightType) return interpreter.primitiveBoolean({ value: false }, ctx)
        const [left, right] = parseBinaryArgs<number, number>(args)
        return interpreter.primitiveBoolean({ value: left == right }, ctx)
    }),

    new NativeFunction("NE", (...args) => { 
        const [interpreter, ctx] = getRuntime(args);
        const [leftType, rightType] = parseBinaryTypes(args);

        if (leftType != rightType) return interpreter.primitiveBoolean({ value: true }, ctx)
        const [left, right] = parseBinaryArgs<number, number>(args)
        return interpreter.primitiveBoolean({ value: left != right }, ctx)
    }),

    new NativeFunction("GT", (...args) => {
        const [interpreter, ctx] = getRuntime(args)
        const [left, right] = parseBinaryArgsAssertType<number>(args, "number", ">");
        return interpreter.primitiveBoolean({ value: left > right }, ctx)
    }),

    new NativeFunction("GTE", (...args) => {
        const [interpreter, ctx] = getRuntime(args)
        const [left, right] = parseBinaryArgsAssertType<number>(args, "number", ">=");
        return interpreter.primitiveBoolean({ value: left >= right }, ctx)
    }),

    new NativeFunction("LT", (...args) => {
        const [interpreter, ctx] = getRuntime(args)
        const [left, right] = parseBinaryArgsAssertType<number>(args, "number", "<");
        return interpreter.primitiveBoolean({ value: left < right }, ctx)
    }),

    new NativeFunction("LTE", (...args) => {
        const [interpreter, ctx] = getRuntime(args)
        const [left, right] = parseBinaryArgsAssertType<number>(args, "number", ">=");
        return interpreter.primitiveBoolean({ value: left <= right }, ctx)
    })
])