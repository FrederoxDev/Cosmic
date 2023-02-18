export class Parser {
  constructor(tokens) {
    this.tokens = tokens
  }

  expectSymbol = (_token, symbol) => {
    const token = _token ?? this.tokens.shift()
    if (token.value != symbol) throw new Error(`Expected symbol '${symbol}' instead got '${token.value}'`)
  }

  statements = () => {
    var statements = []
    var token = this.tokens.shift()
    statements.push(this.statement(token))
    
    while (!["}", "endOfFile"].includes(this.tokens[0].value)) {
      var token = this.tokens.shift()
      statements.push(this.statement(token))
    }

    return {
      type: "BlockStatement",
      body: statements
    }
  }

  statement = (_token) => {
    const token = _token ?? this.tokens.shift()
    if (["if", "fn"].includes(token.value)) return this.compound_stmt(token)

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
      consequent
    }
  }
  
  func_def = (_token) => {
    const fnKeyword = _token ?? this.tokens.shift();
    const identifier = this.tokens.shift()
    this.expectSymbol(null, "(")
    // ... get params
    this.expectSymbol(null, ")")
    const block = this.block()

    return {
      type: "FunctionDeclaration",
      id: identifier,
      params: [],
      body: block
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
        body: statements
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
        // Look for arguments
        // Closing brace
        var closing = this.tokens.shift()
        if (closing.value != ")") throw new Error("Expected ')'")

        left = {
          type: "CallExpression",
          callee: left,
          arguments: []
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
    else if (token.type == "booleanLiteral") return { type: "Boolean", value: token.value.toLowerCase() == "true" }
    else if (token.type == "identifier") return { type: "Identifier", value: token.value }

    // Group
    else if (token.value == "(") {
      let expr = this.expression();
      let next = this.tokens.shift()
      if (next.value != ")") throw new Error(`Expected ')' instead got ${next.type}`)
      return expr
    };

    throw new Error(`Atom expected one of [numberLiteral, stringLiteral, booleanLiteral, identifier] instead got ${token.type}: ${token.value}`);
  }
}  