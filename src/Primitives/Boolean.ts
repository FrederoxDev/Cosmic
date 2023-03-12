import { NativeFunction } from "../Struct/NativeFunction";
import { NativeFunctionHelper } from "../Struct/NativeFunctionHelper";
import { StructInstance } from "../Struct/StructInstance";
import { StructType } from "../Struct/StructType";

export const getBooleanLiteral = (struct: StructInstance) => {
    return struct.selfCtx.getProtected<boolean>("value");
}

export const Boolean = new StructType("Boolean", [
    
])