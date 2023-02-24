import { Function } from "./Function"
import { NativeFunction } from "./NativeFunction"

export type Field = { name: string, type: string }

export class Struct {
    id: string
    fields: Field[]
    nativeImplements: NativeFunction[]
    runtimeImplements: Function[]

    constructor(id: string, fields: Field[], nativeImplements?: NativeFunction[]) {
        this.id = id
        this.fields = fields
        this.nativeImplements = nativeImplements ?? []
        this.runtimeImplements = []
    }

    getMethod(id: string): NativeFunction | Function | undefined {
        const method = this.runtimeImplements.find(func => func.id == id) ?? this.nativeImplements.find(native => native.id == id);
        return method
    }

    inspect() {
        return `[Struct ${this.id}]`
    }

    implementFunctions(functions: Function[]) {
        this.runtimeImplements = [...this.runtimeImplements, ...functions]
    }
}