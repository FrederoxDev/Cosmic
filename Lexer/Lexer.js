const stringLiteralRegex = /"([^"\\]|\\.)*"/;
const numberLiteralRegex = /-?\d+(\.\d+)?/;
const booleanLiteralRegex = /(true|false)/;
const identifierRegex = /[a-zA-Z_]\w*/;
const whitespaceRegex = /\s+/;
const binaryAssignOpRegex = /(\+=|-=|\*=|\/=|%=)/;
const symbolRegex = /(::|->|#|\[|\]|\(|\)|\{|\}|,|;|=|\.)/;
const binaryOpRegex = /(\*\*|\+|\-|\*|\/|%|==|<=|<|>=|>|!=|&&|\|\|)/
const unaryOpRegex = /(!)/

const tokenTypes = [
  { type: 'whitespace', regex: whitespaceRegex },
  { type: 'booleanLiteral', regex: booleanLiteralRegex },
  { type: 'numberLiteral', regex: numberLiteralRegex },
  { type: 'stringLiteral', regex: stringLiteralRegex },
  { type: 'binaryAssignOpSymbol', regex: binaryAssignOpRegex },
  { type: 'binaryOpSymbol', regex: binaryOpRegex },
  { type: 'unaryOpSymbol', regex: unaryOpRegex },
  { type: 'symbol', regex: symbolRegex },
  { type: 'identifier', regex: identifierRegex },
];

export const Tokenize = (input) => {
  const tokens = [];

  while (input.length > 0) {
    let match;
  
    for (const tokenType of tokenTypes) {
      const regex = new RegExp(`^(${tokenType.regex.source})`);
      match = regex.exec(input);
  
      if (match !== null) {
        if (tokenType.type != "whitespace") tokens.push({
          type: tokenType.type,
          value: match[0],
        });

        input = input.slice(match[0].length);
        break;
      }
    }
  
    if (match === null) {
      throw new Error(`Invalid input: ${input}`);
    }
  }

  tokens.push({ type: "endOfFile", value: "endOfFile" })
  return tokens;
}