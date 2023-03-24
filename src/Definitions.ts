import { DisplayDef } from './Definitions/Display';
import { log } from './Definitions/Global';
import { MathDef } from './Definitions/Math';
import { PixelBufferDef } from './Definitions/PixelBuffer';
import { ThreadDef } from './Definitions/Thread';

export type Definition = StructDefinition | EnumDefinition | MethodDefinition | StaticMethodDefinition | PropertyDefinition;

export type PropertyDefinition = {
	type: "Property",
	id: string, 
	propType: string
}

export type StructDefinition = {  
    type: "Struct"
    id: string
    details?: string
	properties?: PropertyDefinition[]
    staticMethods?: StaticMethodDefinition[]
    methods?: MethodDefinition[]
};

export type EnumDefinition = {
    type: "Enum"
    id: string
    details?: string
    fields: string[]
};

export type MethodDefinition = {
    type: "Method"
    id: string
    details?: string
    returnType: string
};

export type StaticMethodDefinition = {
    type: "StaticMethod"
    id: string
    details?: string
    returnType: string
};

/**
 * All type definitions that will be used by the vscode extension
 * Contains typings for the CC-Bedrock Addon
 */
export const typeDefinitions: Definition[] = [
	PixelBufferDef,
    DisplayDef,
    MathDef,
    ThreadDef,
    log
]