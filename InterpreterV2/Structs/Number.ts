import { Context } from "../Context";
import { Interpreter } from "../Interpreter";
import { NumberLiteral } from "../Literals/NumberLiteral";
import { NativeFunction } from "../Primitives/NativeFunction";
import { Struct } from "../Primitives/Struct";
import { StructRuntime } from "../Primitives/StructRuntime";

const parseArgs = (args: any[]): [Interpreter, Context, StructRuntime, StructRuntime] => {
    const interpreter = args[0] as Interpreter;
    const ctx = args[1] as Context;
    const lhs = args[2] as StructRuntime;
    const rhs = args[3] as StructRuntime;
    return [interpreter, ctx, lhs, rhs]
}

export const NumberStruct = new Struct("number", [{name: "value", type: "numberLiteral"}], [
    new NativeFunction("Add", (...args) => { 
        const [interpreter, ctx, lhs, rhs] = parseArgs(args);
        interpreter.assertType("number", "+", rhs);

        const left = lhs.selfCtx.getVariable("value") as NumberLiteral;
        const right = rhs.selfCtx.getVariable("value") as NumberLiteral;
        return interpreter.primitiveNumber({ value: left.value + right.value }, ctx)
    }),

    new NativeFunction("Minus", (...args) => { 
        const [interpreter, ctx, lhs, rhs] = parseArgs(args);
        interpreter.assertType("number", "-", rhs);

        const left = lhs.selfCtx.getVariable("value") as NumberLiteral;
        const right = rhs.selfCtx.getVariable("value") as NumberLiteral;
        return interpreter.primitiveNumber({ value: left.value - right.value }, ctx)
    }),

    new NativeFunction("Mul", (...args) => { 
        const [interpreter, ctx, lhs, rhs] = parseArgs(args);
        interpreter.assertType("number", "*", rhs);

        const left = lhs.selfCtx.getVariable("value") as NumberLiteral;
        const right = rhs.selfCtx.getVariable("value") as NumberLiteral;
        return interpreter.primitiveNumber({ value: left.value * right.value }, ctx)
    }),

    new NativeFunction("Div", (...args) => { 
        const [interpreter, ctx, lhs, rhs] = parseArgs(args);
        interpreter.assertType("number", "/", rhs);

        const left = lhs.selfCtx.getVariable("value") as NumberLiteral;
        const right = rhs.selfCtx.getVariable("value") as NumberLiteral;
        return interpreter.primitiveNumber({ value: left.value / right.value }, ctx)
    }),
])