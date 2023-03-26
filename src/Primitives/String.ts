import { NativeFunction } from "../Struct/NativeFunction";
import { NativeFunctionHelper } from "../Struct/NativeFunctionHelper";
import { StructInstance } from "../Struct/StructInstance";
import { StructType } from "../Struct/StructType";

export const getStringLiteral = (struct: StructInstance) => {
    return struct.selfCtx.getProtected<string>("value");
}

export const String = new StructType("String", [], [
    new NativeFunction("Add", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getStringLiteral(helper.expectType(0, "String"));
        const right = getStringLiteral(helper.expectType(1, "String"));
        return interpreter.string({ value: left + right }, ctx);
    })
])