import { Interpreter } from "../Interpreter";
import { StructInstance } from "./StructInstance";

export class NativeFunctionHelper {
    interpreter: Interpreter
    start: number
    end: number
    args: StructInstance[]
    expectedArgsCount: number

    constructor(interpreter: Interpreter, args: StructInstance[], expectedArgsCount: number, start: number, end: number) {
        this.interpreter = interpreter;
        this.start = start;
        this.end = end;
        this.args = args;
        this.expectedArgsCount = expectedArgsCount;

        if (this.args.length != this.expectedArgsCount) {
            throw interpreter.runtimeErrorCode(`Expected ${this.expectedArgsCount} args, instead got ${this.args.length} args`,
                this.start,
                this.end
            )
        }
    }

    expectType(index: number, expectedType: string): StructInstance {
        if (this.args[index].structType.id != expectedType) throw this.interpreter.runtimeErrorCode(
            `Expected argument: ${index + 1}, to be type of '${expectedType}' instead got type of '${this.args[index].structType.id}'`,
            this.start,
            this.end
        )

        return this.args[index];
    }
}