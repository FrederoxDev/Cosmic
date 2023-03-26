import { NativeFunction } from "./NativeFunction";

type Field = {name: string, type: string}

export class StructType {
    public id: string;
    public fields: Field[]
    public nativeMethods: NativeFunction[];

    constructor (id: string, fields: Field[], nativeMethods: NativeFunction[]) {
        this.id = id;
        this.fields = fields
        this.nativeMethods = nativeMethods;
    }
}