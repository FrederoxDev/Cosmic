import { Context } from "../Context";
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
}