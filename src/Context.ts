export class Context {
    symbolTable: any;
    protectedData: any;
    stack: any;

    constructor() {
        this.symbolTable = {};
        this.protectedData = {};
        this.stack = [];
    }

    setSymbol(id: string, value: any): void {
        this.symbolTable[id] = value;
    }

    getSymbol<T>(id: string): T {
        return this.symbolTable[id];
    } 

    setProtected(id: string, value: any): void {
        this.protectedData[id] = value;
    }

    getProtected<T>(id: string): T {
        return this.protectedData[id]
    }
}