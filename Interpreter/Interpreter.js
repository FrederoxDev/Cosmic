import { Boolean, Number, String } from "./Primitives/index.js"

export class Interpreter {
    constructor(ast) {
        this.ast = ast;
    }

    executeFromStart = () => {
        this.traverseExpr(this.ast)
    }

    /**
     * Will find specific function for traversing a node
     */
    traverseExpr = (node) => {
        const types = [
            { type: "BlockStatement", func: this.blockStatement },
            { type: "BinaryExpression", func: this.binaryExpression },
            { type: "UnaryExpression", func: this.unaryExpression },
            { type: "LogicalExpression", func: this.logicalExpression },
            { type: "Number", func: this.traverseNumber },
            { type: "String", func: this.traverseString },
            { type: "Boolean", func: this.traverseBoolean },
            { type: "IfStatement", func: this.ifStatement },
            { type: "FunctionDeclaration", func: this.functionDeclaration },
            { type: "CallExpression", func: this.callExpression }
        ]
        
        const type = types.find(type => type.type == node.type)
        if (type == undefined) throw new Error(`traverse function does not exist for ${node.type}`)

        return type.func.bind(this)(node)
    }

    functionDeclaration = (node) => {
        console.log(node)
    }
    
    callExpression = (node) => {
        console.log(node)
    }

    blockStatement = (node) => {
        node.body.map(statement => this.traverseExpr(statement))
    }

    /* Primitive Types */
    traverseNumber = (node) => {
        return new Number(node.value)
    }

    traverseString = (node) => {
        return new String(node.value)
    }

    traverseBoolean = (node) => {
        return new Boolean(node.value)
    }

    /* Simple Expressions */
    binaryExpression = (node) => {
        const left = this.traverseExpr(node.left)
        const right = this.traverseExpr(node.right)
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
            throw new Error(`${left.constructor.name} does not have a handler (${handler.handler}) for operator '${operator.value}'`)
        }
        const result = func.bind(left)(right)
        // console.log("Result:", result, "\n")
        return result
    }   

    unaryExpression = (node) => {
        const operator = node.operator
        const argument = this.traverseExpr(node.argument)

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

    logicalExpression = (node) => {
        const left = this.traverseExpr(node.left)
        const right = this.traverseExpr(node.right)
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
    ifStatement = (node) => {
        const test = this.traverseExpr(node.test)

        if (!(test instanceof Boolean)) {
            throw new Error(`Expected Boolean, got ${test.constructor.name}`)
        }

        if (test.value) {
            const consequent = this.traverseExpr(node.consequent)
        }
    } 
}