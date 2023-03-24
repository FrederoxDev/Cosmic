import { Context } from "../Context";
import { Interpreter } from "../Interpreter";
import { NativeFunction } from "./NativeFunction";
import { StructType } from "./StructType";

export class StructInstance {
    public structType: StructType;
    public selfCtx: Context

    constructor(structType: StructType) {
        this.structType = structType
        this.selfCtx = new Context();

        this.structType.nativeMethods.forEach(method => {
            this.selfCtx.setSymbol(method.id, method)
        })
    }

    hasImplementedMethod(id: string): boolean {
        return this.structType.nativeMethods.findIndex(method => method.id === id) != -1;
    }

    getImplementedMethod(id: string): NativeFunction {
        const method = this.structType.nativeMethods.find(method => method.id === id);
        if (method == undefined) 
            throw Interpreter.internalError(`Cannot find ${id} on ${this.structType.id}, check it exists with hasImplementedMethod before getting!`);
        return method
    }
}