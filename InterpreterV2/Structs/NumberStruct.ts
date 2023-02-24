import { Context } from "../Context";
import { Interpreter } from "../Interpreter";
import { Literal } from "../Primitives/Literal";
import { NativeFunction } from "../Primitives/NativeFunction";
import { Struct } from "../Primitives/Struct";
import { StructRuntime } from "../Primitives/StructRuntime";
import { getLiteralValue, parseBinaryArgs, parseBinaryArgsAssertType, parseBinaryTypes } from "./StructCommon";

export const NumberStruct = new Struct("Number", [{name: "value", type: "numberLiteral"}], [
    
    new NativeFunction("Add", (interpreter: Interpreter, ctx: Context, args) => { 
        const [left, right] = parseBinaryArgsAssertType<number>(interpreter, args, "Number", "+");
        return interpreter.primitiveNumber({ value: left + right }, ctx)
    }),

    new NativeFunction("Inspect", (interpreter, ctx, args) => {
        const value = args.selfCtx.getVariable("value").value;
        return interpreter.primitiveString({ value: `${value}` }, ctx)
    })
])