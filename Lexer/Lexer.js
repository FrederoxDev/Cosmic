const stringLiteralRegex = /"([^"\\]|\\.)*"/;
const numberLiteralRegex = /-?\d+(\.\d+)?/;
const BooleanLiteralRegex = /(true|false)/;
const identifierRegex = /[a-zA-Z_]\w*/;
const whitespaceRegex = /\s+/;
const binaryAssignOpRegex = /(\+=|-=|\*=|\/=|%=)/;
const symbolRegex = /(::|->|#|\[|\]|\(|\)|\{|\}|,|;|=|\.)/;
const binaryOpRegex = /(\*\*|\+|\-|\*|\/|%|==|<=|<|>=|>|!=|&&|\|\|)/
const unaryOpRegex = /(!)/

const tokenTypes = [
  { type: 'whitespace', regex: whitespaceRegex },
  { type: 'BooleanLiteral', regex: BooleanLiteralRegex },
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
  let position = 0;

  while (position < input.length) {
    let match = null;

    for (const tokenType of tokenTypes) {
      const regex = new RegExp(`^(${tokenType.regex.source})`);
      match = regex.exec(input.slice(position));

      if (match !== null) {
        const start = position;
        const end = start + match[0].length;

        if (tokenType.type !== "whitespace") {
          tokens.push({
            type: tokenType.type,
            value: match[0],
            start,
            end,
          });
        }

        position = end;
        break;
      }
    }

    if (match === null) {
      throw new Error(`Invalid input: ${input.slice(position)}`);
    }
  }

  tokens.push({
    type: "endOfFile",
    value: "endOfFile",
    start: position,
    end: position,
  });

  return tokens;
};