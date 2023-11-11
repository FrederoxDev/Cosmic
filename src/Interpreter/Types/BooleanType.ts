import { RuntimeError } from "../../Common/GenericError.ts";
import { Ok, Result } from "../../Common/Result.ts";
import { PositionInfo } from "../PositionInfo.ts";
import { Type } from "../Type.ts";

export class BooleanType extends Type {
    name = "Boolean";
    value: boolean;

    constructor(info: PositionInfo, value: boolean) {
        super(info);
        this.value = value;
    }

    not(operator: PositionInfo): Result<unknown, RuntimeError> {
        const info = new PositionInfo(operator.start, this.info.end);
        return Ok(new BooleanType(info, !this.value));
    }
}