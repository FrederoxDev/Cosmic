import { Context } from "../Context";
import { Interpreter } from "../Interpreter";
import { NativeFunction } from "../Primitives/NativeFunction";
import { Struct } from "../Primitives/Struct";
import { parseBinaryArgsAssertType } from "./StructCommon";

export const StringStruct = new Struct("String", [{name: "value", type: "stringLiteral"}], [
    new NativeFunction("EE", async (interpreter: Interpreter, ctx: Context, args) => { 
        const [left, right] = parseBinaryArgsAssertType<number>(interpreter, args, "String", "==");
        return interpreter.primitiveBoolean({ value: left == right }, ctx)
    }),

    new NativeFunction("Inspect", async (interpreter, ctx, args) => {
        return [args, ctx]
    })
])