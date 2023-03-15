import { Context } from "../Context";
import { Interpreter } from "../Interpreter";

export class NativeFunction {
    id: string;
    onCall: (interpreter: Interpreter, ctx: Context, start: number, end: number, ...args: any[]) => Promise<[any, Context]> 

    constructor(id: string, 
        onCall: (interpreter: Interpreter, ctx: Context, start: number, end: number, ...args: any[]) => Promise<[any, Context]>) 
    {
        this.id = id;
        this.onCall = onCall;
    }
}