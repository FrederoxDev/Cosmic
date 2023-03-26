import { CosmicFunction } from "./Struct/CosmicFunction";
import { NativeEnum } from "./Struct/NativeEnum";
import { NativeFunction } from "./Struct/NativeFunction";
import { StructType } from "./Struct/StructType";

export class Context {
    symbolTable: any;
    protectedData: any;
    stack: any;
    structs: any;
    methods: any;
    enums: any;

    constructor(contextToCopy: Context | null = null) {
        this.symbolTable = {};
        this.protectedData = {};
        this.stack = [];
        this.structs = contextToCopy?.structs ?? {};
        this.methods = contextToCopy?.methods ?? {};
        this.enums = contextToCopy?.enums ?? {};
    }

    // Storing structs
    setStructType(id: string, struct: StructType): void {
        this.structs[id] = struct;
    }

    getStructType(id: string): StructType | undefined {
        return this.structs[id];
    }

    setEnum(id: string, enumType: NativeEnum): void {
        this.enums[id] = enumType;
    }

    getEnum(id: string): NativeEnum | undefined {
        return this.enums[id];
    }

    // Storing Methods
    setMethod(id: string, method: NativeFunction | CosmicFunction) {
        this.methods[id] = method;
    }

    getMethod(id: string): NativeFunction | CosmicFunction | undefined {
        return this.methods[id];
    }

    // Storing Variables
    setSymbol(id: string, value: any): void {
        this.symbolTable[id] = value;
    }

    getSymbol<T>(id: string): T {
        return this.symbolTable[id];
    } 

    // Internal data used by native functions
    setProtected(id: string, value: any): void {
        this.protectedData[id] = value;
    }

    getProtected<T>(id: string): T {
        return this.protectedData[id]
    }
}