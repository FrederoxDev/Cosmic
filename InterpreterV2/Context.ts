import { Struct } from "./Primitives/Struct"

export class Context {
    variables: any = {}
    parent: Context | undefined = undefined

    constructor(parent: Context | undefined) {
        this.variables = {}
        this.parent = parent ?? undefined
    }

    getVariable(id: string): any {
        return this.variables[id]
    }

    setVariable(id: string, value: any): void {
        this.variables[id] = value
    }

    /** Used for creating primitive types */
    setStruct(id: string, struct: Struct): void {
        this.setVariable(id, struct)
    }

    getStruct(id: string): Struct | null {
        return this.getVariable(id)
    }
}