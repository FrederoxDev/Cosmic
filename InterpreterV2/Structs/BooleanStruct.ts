import { NativeFunction } from "../Primitives/NativeFunction";
import { Struct } from "../Primitives/Struct";
import { getRuntime, parseBinaryArgsAssertType } from "./StructCommon";

export const BooleanStruct = new Struct("boolean", [{name: "value", type: "booleanLiteral"}], [
    new NativeFunction("Or", (...args) => {
        const [interpreter, ctx] = getRuntime(args)
        const [left, right] = parseBinaryArgsAssertType<boolean>(args, "boolean", "||");
        return interpreter.primitiveBoolean({ value: left || right }, ctx)
    }),

    new NativeFunction("And", (...args) => {
        const [interpreter, ctx] = getRuntime(args)
        const [left, right] = parseBinaryArgsAssertType<boolean>(args, "boolean", "&&");
        return interpreter.primitiveBoolean({ value: left && right }, ctx)
    }),
])