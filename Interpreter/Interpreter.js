import { Boolean, Function, Number, String, NativeFunction } from "./Primitives/index.js"
import { Context } from "./Context.js";

export class Interpreter {
    constructor(ast) {
        this.ast = ast;
        this.globals = new Context()
        this.globals.variables["log"] = new NativeFunction("log", (args => {
            var out = args.map(arg => arg.inspect())
            console.log("\x1b[90m>\x1b[37m", ...out)
        }))
    }

    executeFromStart = () => {
        const ctx = new Context()
        ctx.parent = this.globals

        return this.traverseExpr(this.ast, ctx)
    }

    /**
     * Will find specific function for traversing a node
     */
    traverseExpr = (node, ctx) => {
        if (ctx == undefined) throw new Error("No ctx!")

        const types = [
            { type: "BlockStatement", func: this.blockStatement },
            { type: "BinaryExpression", func: this.binaryExpression },
            { type: "UnaryExpression", func: this.unaryExpression },
            { type: "LogicalExpression", func: this.logicalExpression },
            { type: "Number", func: this.traverseNumber },
            { type: "String", func: this.traverseString },
            { type: "Boolean", func: this.traverseBoolean },
            { type: "Identifier", func: this.traverseIdentifier },
            { type: "IfStatement", func: this.ifStatement },
            { type: "FunctionDeclaration", func: this.functionDeclaration },
            { type: "CallExpression", func: this.callExpression },
            { type: "VariableDeclaration", func: this.variableDeclaration }
        ]
        
        const type = types.find(type => type.type == node.type)
        if (type == undefined) throw new Error(`traverse function does not exist for ${node.type}`)

        return type.func.bind(this)(node, ctx)
    }

    functionDeclaration = (node, ctx) => {
        ctx.variables[node.id.value] = new Function(node.id.value, node.params, node.body)
    }
    
    callExpression = (node, ctx) => {
        const callee = this.traverseExpr(node.callee, ctx)

        if (callee instanceof Function) {
            const funcCtx = new Context()
            funcCtx.parent = this.globals

            return this.traverseExpr(callee.body, funcCtx)
        }
        else if (callee instanceof NativeFunction) {
            var args = node.arguments.map(arg => this.traverseExpr(arg, ctx))
            return callee.onCall(args)
        }
        else {
            throw new Error(`Expected one of type [Function, NativeFunction], instead got ${callee.constructor.name}`)
        }

        // if (!(callee instanceof Function)) throw new Error(`Expected typeof Function, instead got ${callee.constructor.name}`)
        // const funcCtx = new Context()
        
        // return this.traverseExpr(callee.body, funcCtx)
    }

    variableDeclaration = (node, ctx) => {
        ctx.variables[node.id.value] = this.traverseExpr(node.init, ctx)
    }

    blockStatement = (node, ctx) => {
        node.body.map(statement => this.traverseExpr(statement, ctx))
    }

    /* Primitive Types */
    traverseNumber = (node, ctx) => {
        return new Number(node.value)
    }

    traverseString = (node, ctx) => {
        return new String(node.value)
    }

    traverseBoolean = (node, ctx) => {
        return new Boolean(node.value)
    }

    traverseIdentifier = (node, ctx) => {
        const value = ctx.variables[node.value]

        if (value === undefined && ctx.parent == undefined) {
            throw new Error(`'${ node.value }' does not exist in current scope`)
        }
        else if (value === undefined) {
            return this.traverseIdentifier(node, ctx.parent);
        }

        return value
    }

    /* Simple Expressions */
    binaryExpression = (node, ctx) => {
        const left = this.traverseExpr(node.left, ctx)
        const right = this.traverseExpr(node.right, ctx)
        const operator = node.operator

        const handlers = [
            /* Arithmetic Operations */
            { operator: "+", handler: "Add" },
            { operator: "-", handler: "Minus" },
            { operator: "*", handler: "Mul" },
            { operator: "**", handler: "Pow" },
            { operator: "/", handler: "Div" },

            /* Comparison Operations */
            { operator: "==", handler: "EE" },
            { operator: "!=", handler: "NE" },
            { operator: ">", handler: "GT" },
            { operator: ">=", handler: "GTE" },
            { operator: "<", handler: "LT" },
            { operator: "<=", handler: "LTE" },
        ]

        // Operators for primitive types
        const handler = handlers.find(handler => handler.operator == operator.value)
        const func = left[handler.handler] ?? function () {
            throw new Error(`${left.constructor.name} does not have a handler (${handler.handler}) for operator '${operator.value} ${JSON.stringify(left)}'`)
        }
        const result = func.bind(left)(right)
        return result
    }   

    unaryExpression = (node, ctx) => {
        const operator = node.operator
        const argument = this.traverseExpr(node.argument, ctx)

        const handlers = [
            { operator: "!", handler: "Not" },
            { operator: "-", handler: "Negative" }
        ]

        // Operators for primitive types
        const handler = handlers.find(handler => handler.operator == operator)

        const func = argument[handler.handler] ?? function () {
            throw new Error(`${argument.constructor.name} does not have a handler (${handler.handler}) for operator '${operator}'`)
        }
        const result = func.bind(argument)()
        return result
    }

    logicalExpression = (node, ctx) => {
        const left = this.traverseExpr(node.left, ctx)
        const right = this.traverseExpr(node.right, ctx)
        const operator = node.operator

        const handlers = [
            { operator: "&&", handler: "And" },
            { operator: "||", handler: "Or" }
        ]

        // Operators for primitive types
        const handler = handlers.find(handler => handler.operator == operator.value)
        const func = left[handler.handler] ?? function () {
            throw new Error(`${left.constructor.name} does not have a handler (${handler.handler}) for operator '${operator.value}'`)
        }
        const result = func.bind(left)(right)
        return result
    }

    /* Compound Expressions */
    ifStatement = (node, ctx) => {
        const test = this.traverseExpr(node.test, ctx)

        if (!(test instanceof Boolean)) {
            throw new Error(`Expected Boolean, got ${test.constructor.name}`)
        }

        if (test.value) {
            const consequent = this.traverseExpr(node.consequent, ctx)
        }
    } 
}