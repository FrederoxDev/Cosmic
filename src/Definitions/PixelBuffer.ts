import { StructDefinition } from '../Definitions';

export const PixelBufferDef: StructDefinition = {
	type: "Struct",
	id: "PixelBuffer",
	staticMethods: [
		{
			type: "StaticMethod",
			id: "New",
			details: "Returns an instance of a pixel buffer",
			returnType: "PixelBuffer"
		}
	],
	methods: [
		{
			type: "Method",
			id: "DrawPixel",
			details: "Sets a single pixel on screen",
			returnType: "Void"
		},
		{
			type: "Method",
			id: "DrawLine",
			details: "Draws a line between two points",
			returnType: "Void"
		},
		{
			type: "Method",
			id: "DrawCircle",
			details: "Draws a circle at a point",
			returnType: "Void"
		},
		{
			type: "Method",
			id: "DrawText",
			details: "Draws text from the top left corner of the screen, will wrap around lines",
			returnType: "Void"
		}
	]
}