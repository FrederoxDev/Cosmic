import { RuntimeError } from "../../Common/GenericError.ts";
import { Err, Ok, Result } from "../../Common/Result.ts";
import { PositionInfo } from "../PositionInfo.ts";
import { Type } from "../Type.ts";

export class StringType extends Type {
    name = "String";
    value: string;

    constructor(info: PositionInfo, value: string) {
        super(info);
        this.value = value;
    }

    add(rhs: Type): Result<unknown, RuntimeError> {
        const info = new PositionInfo(this.info.start, rhs.info.end);

        if (rhs.name == "String") {
            return Ok(new StringType(info, this.value + (rhs as StringType).value))    
        }
        
        return this.rhsNotImplemented(rhs, "+");
    }
}