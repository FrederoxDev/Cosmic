export class Context {
    variables: any = {}
    parent: Context | undefined = undefined

    constructor(parent: Context | undefined) {
        this.variables = {}
        this.parent = parent ?? undefined
    }

    getVariable(id: string): any {
        if (this.hasVariable(id)) return this.variables[id]
        if (this.parent != undefined) return this.parent.getVariable(id);
        return null;
    }

    setVariable(id: string, value: any): void {
        this.variables[id] = value;
    }

    hasVariable(id: string): boolean {
        return this.variables[id] != undefined;
    }
}