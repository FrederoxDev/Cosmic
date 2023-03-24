import { NativeFunction } from "./NativeFunction";

export class StructType {
    public id: string;
    public nativeMethods: NativeFunction[];

    constructor (id: string, nativeMethods: NativeFunction[]) {
        this.id = id;
        this.nativeMethods = nativeMethods;
    }
}