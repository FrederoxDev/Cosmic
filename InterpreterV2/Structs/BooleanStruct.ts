import { NativeFunction } from "../Primitives/NativeFunction";
import { Struct } from "../Primitives/Struct";
import { parseBinaryArgsAssertType } from "./StructCommon";

export const BooleanStruct = new Struct("Boolean", [{name: "value", type: "booleanLiteral"}], [
    new NativeFunction("Inspect", (interpreter, ctx, args) => {
        const value = args.selfCtx.getVariable("value").value;
        return interpreter.primitiveString({ value: `${value}` }, ctx)
    })
])