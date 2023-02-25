import { Context } from "../Context";
import { Interpreter } from "../Interpreter";
import { NativeFunction } from "../Primitives/NativeFunction";
import { Struct } from "../Primitives/Struct";
import { parseBinaryArgsAssertType } from "./StructCommon";

export const NumberStruct = new Struct("Number", [{name: "value", type: "numberLiteral"}], [
    new NativeFunction("Add", async (interpreter: Interpreter, ctx: Context, args) => { 
        const [left, right] = parseBinaryArgsAssertType<number>(interpreter, args, "Number", "+");
        return interpreter.primitiveNumber({ value: left + right }, ctx)
    }),

    new NativeFunction("Inspect", async (interpreter, ctx, args) => {
        const value = args.selfCtx.getVariable("value").value;
        return interpreter.primitiveString({ value: `${value}` }, ctx)
    })
])