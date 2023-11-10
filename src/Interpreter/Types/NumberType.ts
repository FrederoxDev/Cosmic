import { RuntimeError } from "../../Common/GenericError.ts";
import { Err, Ok, Result } from "../../Common/Result.ts";
import { PositionInfo } from "../PositionInfo.ts";
import { Type } from "../Type.ts";

export class NumberType extends Type {
    name = "Number";
    value: number;

    constructor(info: PositionInfo, value: number) {
        super(info);
        this.value = value;
    }

    add(rhs: Type): Result<unknown, RuntimeError> {
        const info = new PositionInfo(this.info.start, rhs.info.end);

        if (rhs.name == "Number") {
            return Ok(new NumberType(info, this.value + (rhs as NumberType).value))    
        }
        
        return Err(this.runtimeError(`${this.name} does not implement operator + for ${rhs.name}`));
    }

    sub(rhs: Type): Result<unknown, RuntimeError> {
        const info = new PositionInfo(this.info.start, rhs.info.end);

        if (rhs.name == "Number") {
            return Ok(new NumberType(info, this.value - (rhs as NumberType).value))    
        }
        
        return Err(this.runtimeError(`${this.name} does not implement operator - for ${rhs.name}`));
    }
}