import { NativeFunction } from "../Struct/NativeFunction";
import { NativeFunctionHelper } from "../Struct/NativeFunctionHelper";
import { StructInstance } from "../Struct/StructInstance";
import { StructType } from "../Struct/StructType";

export const getBooleanLiteral = (struct: StructInstance) => {
    return struct.selfCtx.getProtected<boolean>("value");
}

export const Boolean = new StructType("Boolean", [
    new NativeFunction("And", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getBooleanLiteral(helper.expectType(0, "Boolean"));
        const right = getBooleanLiteral(helper.expectType(1, "Boolean"));
        return interpreter.boolean({ value: left && right }, ctx);
    }),

    new NativeFunction("Or", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getBooleanLiteral(helper.expectType(0, "Boolean"));
        const right = getBooleanLiteral(helper.expectType(1, "Boolean"));
        return interpreter.boolean({ value: left || right }, ctx);
    }),
])