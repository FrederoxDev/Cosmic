export class Parser {
  constructor(tokens, code) {
    this.tokens = tokens
    this.code = code
  }

  expectSymbol = (_token, symbol) => {
    const token = _token ?? this.tokens.shift()
    if (token.value == symbol) return;

    this.parseError(`Expected symbol '${symbol}' instead got '${token.value}`, token.start, token.end)
  }

  parseError = (message, startIdx, endIdx) => {
    const lineStart = this.code.lastIndexOf("\n", startIdx) + 1;
    const line = this.code.substring(lineStart, endIdx);
    const lineNum = this.code.substring(0, startIdx).split("\n").length;
    const colNum = startIdx - lineStart + 1;

    const err = new Error(`${message}, at line ${lineNum}, column ${colNum}'`)
    err.stack = ""
    err.name = "Parser"

    console.log(line);
    console.log(`${" ".repeat(startIdx - lineStart)}${"^".repeat(endIdx - startIdx)}`);
    throw err;
  }

  parse = () => {
    try {
      return [this.statements(), null]
    }
    catch (e) {
      return [null, e]
    }
  }

  statements = () => {
    var statements = []
    var token = this.tokens.shift()
    const start = token.start
    statements.push(this.statement(token))
    
    while (!["}", "endOfFile"].includes(this.tokens[0].value)) {
      var token = this.tokens.shift()
      statements.push(this.statement(token))
    }

    return {
      type: "BlockStatement",
      body: statements,
      start,
      end: token.end
    }
  }

  statement = (_token) => {
    const token = _token ?? this.tokens.shift()
    if (["if", "fn", "struct", "impl"].includes(token.value)) return this.compound_stmt(token)
    if (["let"].includes(token.value)) {
      let stmt = this.simple_stmt(token)
      this.expectSymbol(null, ";")
      return stmt
    }

    const expr = this.expression(token)
    this.expectSymbol(null, ";")
    return expr
  }

  compound_stmt = (_token) => {
    const token = _token ?? this.tokens.shift()
    if (token.value == "if") return this.if_stmt(token)
    else if (token.value == "fn") return this.func_def(token)
    else if (token.value == "struct") return this.struct_stmt(token)
    else if (token.value == "impl") return this.impl_stmt(token)
  }

  struct_stmt = (_token) => {
    const structKeyword = _token ?? this.tokens.shift()
    const start = structKeyword.start;
    const identifier = this.tokens.shift()

    this.expectSymbol(null, "{")
    const fields = []

    while (this.tokens[0].value != "}") {
      const name = this.tokens.shift()
      this.expectSymbol(null, ":")
      const type = this.tokens.shift()
      fields.push([name, type])

      if (this.tokens[0].value == "}") break;
      // Optional comma at last field
      if (this.tokens[1].value == "}") {
        this.expectSymbol(null, ",")
      }
      else this.expectSymbol(null, ",")
    }

    var closing = this.tokens.shift()
    this.expectSymbol(closing, "}")

    return {
      type: "StructDeclaration",
      id: identifier,
      fields,
      start,
      end: closing.end
    }
  }

  impl_stmt = (_token) => {
    const implKeyword = _token ?? this.tokens.shift()
    const start = implKeyword.start;
    const structId = this.tokens.shift()

    this.expectSymbol(null, "{")

    var functions = []

    while(this.tokens[0].value != "}") {
      functions.push(this.func_def())
    }

    const closing = this.tokens.shift()
    this.expectSymbol(closing, "}")

    return {
      type: "StructImpl",
      structId,
      start,
      functions,
      end: closing.end
    }
  }

  if_stmt = (_token) => {
    const ifKeyword = _token ?? this.tokens.shift()
    this.expectSymbol(null, "(")
    const test = this.expression()
    this.expectSymbol(null, ")")
    const consequent = this.block()

    return {
      type: "IfStatement",
      test,
      consequent: consequent.body
    }
  }
  
  func_def = (_token) => {
    const fnKeyword = _token ?? this.tokens.shift();
    const identifier = this.tokens.shift()
    this.expectSymbol(null, "(")
    // ...params
    this.expectSymbol(null, ")")
    const block = this.block()

    return {
      type: "FunctionDeclaration",
      id: identifier,
      params: [],
      body: block.body
    }
  }

  params = (_token) => {
    var parameters = []

    // No params passed
    if (this.tokens[0].value == ")") return []
    parameters.push(this.expression())

    while (this.tokens[0].value == ",") {
      this.tokens.shift()
      parameters.push(this.expression())
    }

    return parameters
  }

  simple_stmt = (_token) => {
    const token = _token ?? this.tokens.shift()
    if (token.value == "let") return this.variableDeclaration(token) 
  }

  variableDeclaration = (_token) => {
    const letToken = _token ?? this.tokens.shift()
    const identifier = this.tokens.shift();
    let init = undefined;

    if (this.tokens[0].value == "=") {
      this.tokens.shift()
      init = this.expression()
    }

    return {
      type: "VariableDeclaration",
      id: identifier,
      init
    }
  }

  block = (_token) => {
    const token = _token ?? this.tokens.shift()

    if (token.value == "{") {
      const statements = this.statements()
      const closing = this.tokens.shift()
      if (closing.value != "}") throw new Error("Expected }")

      return {
        type: "BlockStatement",
        body: statements,
        start: token.start,
        end: closing.end
      }
    } 

    else {
      return this.expression(token);
    }
  }

  expression = (_token) => {
    var left = this.comparison(_token ?? this.tokens.shift())

    while (["&&", "||"].includes(this.tokens[0]?.value)) {
      let operator = this.tokens.shift()
      let right = this.comparison(this.tokens.shift())
      left = {
        type: "LogicalExpression",
        left,
        operator,
        right
      }
    }
    return left
  }

  comparison = (_token) => {
    var left = this.sum(_token ?? this.tokens.shift())

    while (["!=", "==", ">", ">=", "<", "<="].includes(this.tokens[0]?.value)) {
      let operator = this.tokens.shift()
      let right = this.sum(this.tokens.shift())
      left = {
        type: "BinaryExpression",
        left,
        operator,
        right
      }
    }

    return left;
  }

  sum = (_token) => {
    let left = this.term(_token ?? this.tokens.shift());

    while (["+", "-"].includes(this.tokens[0]?.value)) {
      let operator = this.tokens.shift()
      let right = this.term(this.tokens.shift())
      left = {
        type: "BinaryExpression",
        left,
        operator,
        right
      }
    }

    return left;
  }

  term = (_token) => {
    let left = this.factor(_token ?? this.tokens.shift());

    while (["*", "/", "%"].includes(this.tokens[0]?.value)) {
      let operator = this.tokens.shift()
      let right = this.term(this.tokens.shift())
      left = {
        type: "BinaryExpression",
        left,
        operator,
        right
      }
    }

    return this.factor(left);
  }

  factor = (_token) => {
    let token = _token ?? this.tokens.shift();

    if (["-", "!"].includes(token.value)) {
      let factor = this.factor();
      return {
        type: "UnaryExpression",
        argument: factor,
        operator: token.value
      }
    }

    return this.power(token)
  }

  power = (_token) => {
    let left = this.primary(_token ?? this.tokens.shift());

    if (this.tokens[0].value == "**") {
      let operator = this.tokens.shift()
      let right = this.factor()

      return {
        type: "BinaryExpression",
        left,
        operator,
        right
      }
    }

    return left
  }

  primary = (_token) => {
    let left = this.atom(_token ?? this.tokens.shift());

    while ([".", "(", "{"].includes(this.tokens[0]?.value)) {
      let op = this.tokens.shift()

      if (op.value == ".") {
        let right = this.atom()
        left = {
          type: "MemberExpression",
          object: left,
          property: right
        }
      }

      else if (op.value == "(") {
        var params = this.params()
        var closing = this.tokens.shift()
        if (closing.value != ")") throw new Error("Expected ')'")

        left = {
          type: "CallExpression",
          callee: left,
          arguments: params
        }

      }

      else if (op.value == "{") {
        const fields = []

        while (this.tokens[0].value != "}") {
          const name = this.tokens.shift()
          this.expectSymbol(null, ":")
          const value = this.expression()
          fields.push([name, value])

          if (this.tokens[0].value == "}") break;
          // Optional comma at last field
          if (this.tokens[1].value == "}") {
            this.expectSymbol(null, ",")
          }
          else this.expectSymbol(null, ",")
        }

        this.expectSymbol(null, "}")

        left = {
          type: "StructExpression",
          id: left,
          fields
        }
      }
    }

    return left
  }

  atom = (_token) => {
    let token = _token ?? this.tokens.shift();

    // Literally just ignore
    if (["Number", "Identifier", "String", "Boolean", "BinaryExpression", "UnaryExpression", "MemberExpression", "CallExpression",
    "StructExpression"
    ].includes(token.type)) return token;

    if (token.type == "numberLiteral") return { type: "Number", value: parseFloat(token.value) }
    else if (token.type == "stringLiteral") return { type: "String", value: token.value.substring(1, token.value.length - 1) }
    else if (token.type == "BooleanLiteral") return { type: "Boolean", value: token.value.toLowerCase() == "true" }
    else if (token.type == "identifier") return { type: "Identifier", value: token.value }

    // Group
    else if (token.value == "(") {
      let expr = this.expression();
      let next = this.tokens.shift()
      if (next.value != ")") throw new Error(`Expected ')' instead got ${next.type}`)
      return expr
    };

    this.parseError(`Expected type of [numberLiteral, stringLiteral, BooleanLiteral, identifier] instead got (type: '${token.type}', value: '${token.value}')`, token.start, token.end)
  }
}  