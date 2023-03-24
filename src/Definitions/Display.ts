import { StructDefinition } from '../Definitions';

export const DisplayDef: StructDefinition = {
	type: "Struct",
	id: "Display",
	staticMethods: [
		{
			type: "StaticMethod",
			id: "Connect",
			details: "Returns an instance of a display",
			returnType: "Display"
		}
	],
	methods: [
		{
			type: "Method",
			id: "DrawBuffer",
			details: "Draws the pixel buffer to the screen",
			returnType: "Void"
		}
	]
}