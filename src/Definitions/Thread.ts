import { StructDefinition } from '../Definitions';

export const ThreadDef: StructDefinition = {
	type: "Struct",
	id: "Thread",
	staticMethods: [
		{
			type: "StaticMethod",
			id: "Sleep",
			details: "Pauses the thread for a number of minecraft ticks",
			returnType: "Void"
		}
	]
}