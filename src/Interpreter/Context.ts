export class Context {
    parent: Context | undefined = undefined
    private variables: any = {}
    private protectedData: any = {}

    constructor(parent: Context | undefined) {
        this.variables = {}
        this.protectedData = {}
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

    setProtectedData(key: string, value: any) {
        if (this.parent) this.parent.setProtectedData(key, value);
        else this.protectedData[key] = value;
    }

    getProtectedData(key: string) {
        if (this.parent) return this.parent.getProtectedData(key);
        return this.protectedData[key];
    }
}