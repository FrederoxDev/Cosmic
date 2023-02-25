const stringLiteralRegex = /"([^"\\]|\\.)*"/;
const numberLiteralRegex = /-?\d+(\.\d+)?/;
const BooleanLiteralRegex = /(true|false)/;
const identifierRegex = /[a-zA-Z_0-9]\w*/;
const whitespaceRegex = /\s+/;
const binaryAssignOpRegex = /(\+=|-=|\*=|\/=|%=)/;
const symbolRegex = /(::|->|#|\[|\]|\(|\)|\{|\}|,|;|=|\.|:|&)/;
const binaryOpRegex = /(\*\*|\+|\-|\*|\/|%|==|<=|<|>=|>|!=|&&|\|\|)/
const unaryOpRegex = /(!)/
const multiLineComment = /\/\*.*\*\//s

const tokenTypes = [
  { type: 'multiLineComment', regex: multiLineComment },
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

type LexerToken = { type: string; value: string; start: number; end: number; };

export const Tokenize = (input: string) => {
  const tokens: LexerToken[] = [];
  let position = 0;

  while (position < input.length) {
    let match: RegExpExecArray | null = null;

    for (const tokenType of tokenTypes) {
      const regex = new RegExp(`^(${tokenType.regex.source})`);
      match = regex.exec(input.slice(position));

      if (match !== null) {
        const start = position;
        const end = start + match[0].length;

        if (!["whitespace", "multiLineComment"].includes(tokenType.type)) {
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