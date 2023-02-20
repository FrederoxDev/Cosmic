import { NativeFunction } from "./NativeFunction"

export type field = { name: string, type: string }

export class Struct {
    id: string
    fields: field[]
    nativeImplements: NativeFunction[]

    constructor(id: string, fields: field[], nativeImplements?: NativeFunction[]) {
        this.id = id
        this.fields = fields
        this.nativeImplements = nativeImplements ?? []
    }

    toString() {
        return new String(`[Struct ${this.id}]`)
    }

    inspect() {
        return `[Struct ${this.id}]`
    }
}