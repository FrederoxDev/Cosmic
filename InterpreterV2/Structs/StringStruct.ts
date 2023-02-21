import { NativeFunction } from "../Primitives/NativeFunction";
import { Struct } from "../Primitives/Struct";
import { parseBinaryArgsAssertType } from "./StructCommon";

export const StringStruct = new Struct("string", [{name: "value", type: "stringLiteral"}], [
    new NativeFunction("Inspect", (interpreter, ctx, args) => {
        return args
    })
])