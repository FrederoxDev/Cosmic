const stringLiteralRegex = /^("([^"\\]|\\.)*")/;
const numberLiteralRegex = /^(-?\d+(\.\d+)?)/;
const BooleanLiteralRegex = /^((true|false))/;
const identifierRegex = /^([a-zA-Z_0-9]\w*)/;
const whitespaceRegex = /^(\s+)/;
const binaryAssignOpRegex = /^((\+=|-=|\*=|\/=|%=))/;
const symbolRegex = /^((::|->|#|\[|\]|\(|\)|\{|\}|,|;|=|\.|:|&))/;
const binaryOpRegex = /^((\*\*|\+|\-|\*|\/|%|==|<=|<|>=|>|!=|&&|\|\|))/
const unaryOpRegex = /^((!))/
const multiLineComment = /^(\/\*.*\*\/)/s
const commentRegex = /^(\/\/.*)/m

// All regexes surrounded by "^( <regex> )""

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

type LexerToken = { type: string; value: string; start: number; end: number; };
type IllegalCharacterError = { type: "IllegalCharacterError", char: string, message: string, start: number, end: number }

export const Tokenize = (input: string): LexerToken[] | IllegalCharacterError => {
  const tokens: LexerToken[] = [];
  let position = 0;

  while (position < input.length) {
    const commentMatch = commentRegex.exec(input.slice(position));
    if (commentMatch !== null) {
      position += commentMatch[0].length + 2
      continue;
    }

    let match: RegExpExecArray | null = null;

    for (const tokenType of tokenTypes) {
      match = tokenType.regex.exec(input.slice(position));

      if (match !== null) {
        const start = position;
        const end = start + match[0].length;

        if (!["whitespace"].includes(tokenType.type)) {
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
      return {
        type: "IllegalCharacterError",
        char: `${input.slice(position)}`,
        message: `'${input[position]}' is not a valid character`,
        start: position,
        end: position + 1
      }
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