export class Parser {
  constructor(tokens, code) {
    this.tokens = tokens
    this.code = code
  }

  expectSymbol = (_token, symbol) => {
    const token = _token ?? this.tokens.shift()
    if (token.value == symbol) return;

    const lineStart = this.code.lastIndexOf("\n", token.start) + 1;
    const line = this.code.substring(lineStart, token.end);
    const lineNum = this.code.substring(0, token.start).split("\n").length;
    const colNum = token.start - lineStart + 1;

    const err = new Error(`Expected symbol '${symbol}' instead got '${token.value}', at line ${lineNum}, column ${colNum}'`)
    err.stack = ""
    err.name = "Parser"

    console.log(line);
    console.log(`${" ".repeat(token.start - lineStart)}${"^".repeat(token.end - token.start)}`);
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
    if (["if", "fn"].includes(token.value)) return this.compound_stmt(token)
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

    while ([".", "("].includes(this.tokens[0]?.value)) {
      let op = this.tokens.shift()

      if (op.value == ".") {
        let right = this.atom()
        left = {
          type: "MemberExpression",
          object: left,
          property: right
        }
      }

      else {
        var params = this.params()
        var closing = this.tokens.shift()
        if (closing.value != ")") throw new Error("Expected ')'")

        left = {
          type: "CallExpression",
          callee: left,
          arguments: params
        }

      }
    }

    return left
  }

  atom = (_token) => {
    let token = _token ?? this.tokens.shift();

    // Literally just ignore
    if (["Number", "Identifier", "String", "Boolean", "BinaryExpression", "UnaryExpression", "MemberExpression", "CallExpression"
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

    throw new Error(`Atom expected one of [numberLiteral, stringLiteral, BooleanLiteral, identifier] instead got ${token.type}: ${token.value}`);
  }
}  