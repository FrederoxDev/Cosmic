import { Boolean, Function, Number, String, NativeFunction, Struct, StructInstance } from "./Primitives/index.js"
import { Context } from "./Context.js";

export class Interpreter {
    constructor(ast) {
        this.currentSelf = undefined;
        this.ast = ast;
        this.globals = new Context()

        this.globals.nativeStruct("console", [], [
            new NativeFunction("log", () => {
                console.log("console.log()")
            })
        ])
        
        this.globals.variables["log"] = new NativeFunction("log", (args => {
            var out = args.map(arg => arg?.inspect?.())
            console.log("\x1b[90m>\x1b[37m", ...out)
        }))
    }

    executeFromStart = () => {
        try {
            const ctx = new Context()
            ctx.parent = this.globals
            return [this.traverseExpr(this.ast, ctx), null]
        }

        catch(e) {
            return [null, e]
        }
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
            { type: "VariableDeclaration", func: this.variableDeclaration },
            { type: "StructDeclaration", func: this.structDeclaration },
            { type: "StructExpression", func: this.structExpression },
            { type: "StructImpl", func: this.structImpl },
            { type: "MemberExpression", func: this.memberExpression },
            { type: "ReturnExpression", func: this.returnExpression }
        ]

        const type = types.find(type => type.type == node.type)
        if (type == undefined) throw new Error(`traverse function does not exist for ${node.type}`)

        return type.func.bind(this)(node, ctx)
    }

    memberExpression = (node, ctx) => {
        const object = node.object.value === "self" ? this.currentSelf : this.traverseExpr(node.object, ctx)
        const objCtx = object.selfCtx;

        const property = this.traverseExpr(node.property, objCtx)
        this.currentSelf = object
        return property
    }

    structDeclaration = (node, ctx) => {
        ctx.variables[node.id.value] = new Struct(node.id.value, node.fields)
    }

    structExpression = (node, ctx) => {
        const structBase = this.traverseIdentifier(node.id, ctx)
        const structCtx = new Context(this.globals)

        structBase.fields.forEach(field => {
            const name = field[0].value;
            const expectedType = field[1].value;

            const match = node.fields.find(field => field[0].value == name)
            if (match == undefined) throw new Error("Missing Field")

            const value = this.traverseExpr(match[1], ctx)
            // TODO: CHECK TYPE MATCH

            structCtx.variables[name] = value
        })

        structBase.implements.forEach(func => {
            this.functionDeclaration(func, structCtx)
        })

        return new StructInstance(structBase, structCtx)
    }

    structImpl = (node, ctx) => {
        var structBase = this.traverseIdentifier(node.structId, ctx)
        node.functions.forEach(func => {
            structBase.implement(func);
        })

        ctx.variables[node.structId] = structBase;
    }

    functionDeclaration = (node, ctx) => {
        ctx.variables[node.id.value] = new Function(node.id.value, node.params, node.body)
    }

    returnExpression = (node, ctx) => {
        if (node.value != undefined)
            return this.traverseExpr(node.value, ctx)

        else return undefined
    }
    
    callExpression = (node, ctx) => {
        const callee = this.traverseExpr(node.callee, ctx)
        const calleeArgTypes = callee.args;

        if (callee instanceof Function) {
            const funcCtx = new Context()
            funcCtx.parent = this.globals

            for (var i = 0; i < calleeArgTypes.length; i++) {
                const id = calleeArgTypes[i].id
                const type = calleeArgTypes[i]
                const value = this.traverseExpr(node.arguments[i], ctx)
                // Todo check type of value

                funcCtx.variables[id] = value
            }

            return this.traverseExpr(callee.body, funcCtx)
        }
        else if (callee instanceof NativeFunction) {
            var args = node.arguments.map(arg => this.traverseExpr(arg, ctx))
            return callee.onCall(args)
        }
        else {
            throw new Error(`Expected one of type [Function, NativeFunction], instead got ${callee.constructor.name}`)
        }
    }

    variableDeclaration = (node, ctx) => {
        ctx.variables[node.id.value] = this.traverseExpr(node.init, ctx)
    }

    blockStatement = (node, ctx) => {
        for (var i = 0; i < node.body.length; i++) {
            const statement = node.body[i];
            if (statement.type == "ReturnExpression") return this.traverseExpr(statement, ctx)
            else this.traverseExpr(statement, ctx)
        }
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