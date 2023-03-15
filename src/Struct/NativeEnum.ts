import { Context } from "../Context";
import { Interpreter } from "../Interpreter";

export class NativeEnum {
    id: string;
    values: string[];

    constructor(id: string, values: string[]) 
    {
        this.id = id;
        this.values = values
    }
}