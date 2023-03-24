import { StructDefinition } from '../Definitions';

export const MathDef: StructDefinition = {
	type: "Struct",
	id: "Math",
	staticMethods: [
		{
			type: "StaticMethod",
			id: "Sin",
			details: "Returns the sine of a number in radians",
			returnType: "Number"
		},
		{
			type: "StaticMethod",
			id: "Cos",
			details: "Returns the cosine of a number in radians",
			returnType: "Number"
		},
		{
			type: "StaticMethod",
			id: "Tan",
			details: "Returns the tangent of a number in radians",
			returnType: "Number"
		},
		{
			type: "StaticMethod",
			id: "Floor",
			details: "Returns the closest integer, rounds down",
			returnType: "Number"
		}
	]
}