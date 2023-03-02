import { NativeFunction } from "../Primitives/NativeFunction";
import { Struct } from "../Primitives/Struct";
import { parseBinaryArgsAssertType } from "./StructCommon";

export const ArrayStruct = new Struct("Array", [], [
    new NativeFunction("Index", async (interpreter, ctx, args) => {
        const arr = args[0].selfCtx.getVariable("value").value;
        var index = args[1].selfCtx.getVariable("value").value;
        if (index >= arr.length) throw interpreter.runtimeError("Index out of range!")
        return [arr[index], ctx];
    })
])