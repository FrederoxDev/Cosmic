import { NativeFunction } from "../Struct/NativeFunction";
import { NativeFunctionHelper } from "../Struct/NativeFunctionHelper";
import { StructInstance } from "../Struct/StructInstance";
import { StructType } from "../Struct/StructType";

export const getNumberLiteral = (struct: StructInstance) => {
    return struct.selfCtx.getProtected<number>("value");
}

export const Number = new StructType("Number", [], [
    new NativeFunction("Add", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getNumberLiteral(helper.expectType(0, "Number"));
        const right = getNumberLiteral(helper.expectType(1, "Number"));
        return interpreter.number({ value: left + right }, ctx);
    }),

    new NativeFunction("Minus", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getNumberLiteral(helper.expectType(0, "Number"));
        const right = getNumberLiteral(helper.expectType(1, "Number"));
        return interpreter.number({ value: left - right }, ctx);
    }),

    new NativeFunction("Div", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getNumberLiteral(helper.expectType(0, "Number"));
        const right = getNumberLiteral(helper.expectType(1, "Number"));
        return interpreter.number({ value: left / right }, ctx);
    }),

    new NativeFunction("Mul", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getNumberLiteral(helper.expectType(0, "Number"));
        const right = getNumberLiteral(helper.expectType(1, "Number"));
        return interpreter.number({ value: left * right }, ctx);
    }),

    new NativeFunction("Mod", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getNumberLiteral(helper.expectType(0, "Number"));
        const right = getNumberLiteral(helper.expectType(1, "Number"));
        return interpreter.number({ value: left % right }, ctx);
    }),

    new NativeFunction("LT", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getNumberLiteral(helper.expectType(0, "Number"));
        const right = getNumberLiteral(helper.expectType(1, "Number"));
        return interpreter.boolean({ value: left < right }, ctx);
    }),

    new NativeFunction("LTE", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getNumberLiteral(helper.expectType(0, "Number"));
        const right = getNumberLiteral(helper.expectType(1, "Number"));
        return interpreter.boolean({ value: left <= right }, ctx);
    }),

    new NativeFunction("GT", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getNumberLiteral(helper.expectType(0, "Number"));
        const right = getNumberLiteral(helper.expectType(1, "Number"));
        return interpreter.boolean({ value: left > right }, ctx);
    }),

    new NativeFunction("GTE", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getNumberLiteral(helper.expectType(0, "Number"));
        const right = getNumberLiteral(helper.expectType(1, "Number"));
        return interpreter.boolean({ value: left >= right }, ctx);
    }),

    new NativeFunction("EE", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const left = getNumberLiteral(helper.expectType(0, "Number"));
        const right = getNumberLiteral(helper.expectType(1, "Number"));
        return interpreter.boolean({ value: left === right }, ctx);
    })
])