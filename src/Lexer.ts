import { CosmicError, CosmicErrorBase, IllegalCharacter } from "./Common/GenericError.ts";
import { Err, Ok, Result } from "./Common/Result.ts";

const tokenTypes = {
    InlineComment: /^\/\/.*(?=\W)/,
    MultiLineComment: /^\/\*([^*\\]|\\.)*\*\//,
    Whitespace: /^(\s+)/,
    StringLiteral: /^("([^"\\]|\\.)*")/,
    BooleanLiteral: /^((true|false))/,
    NumberLiteral: /^(-?\d+(\.\d+)?)/,
    Identifier: /^([a-zA-Z_0-9]\w*)/,
    Symbol: /(\/|\*|-|\+|>=|>|<=|<|==|!=|\(|\))/
}

const tokenTypeKeys: string[] = Object.keys(tokenTypes);

// deno-lint-ignore no-explicit-any
export type LexerToken = { type: keyof typeof tokenTypes | "EndOfFile", value: any, start: number, end: number};

export function parseToTokens(input: string, debugTokensToFile: boolean): Result<LexerToken[], CosmicError[]> {
    const start = performance.now();
    input += "\n"
    let position = 0;
    const tokens: LexerToken[] = [];
    let hasFailed = false;
    const issues = []

    while (position < input.length) {
        let match = null;

        for (let i = 0; i < tokenTypeKeys.length; i++) {
            //@ts-ignore TS Nonsense
            const regex = tokenTypes[tokenTypeKeys[i]];

            // Use the regular expression to match against the input at the current position
            match = input.slice(position).match(regex);

            if (match) {
                // Add the matched token to the tokens array
                tokens.push({
                    //@ts-ignore This should be fine in TS
                    type: tokenTypeKeys[i],
                    value: match[0],
                    start: position,
                    end: position + match[0].length
                });

                // Move the position forward by the length of the matched token
                position += match[0].length;
                break;
            }
        }

        if (match === null) {
            const illegalChar = input.slice(position, position + 1);
            hasFailed = true;

            issues.push({
                type: "IllegalCharacter",
                reason: `Illegal Character: '${illegalChar}'`,
                illegalChar,
                start: position,
                end: position + 1
            } as IllegalCharacter)

            position += 1
        }
    }

    if (hasFailed) return Err(issues);

    tokens.push({
        type: "EndOfFile",
        value: undefined,
        start: position,
        end: position
    })

    const tokensToExclude = ["Whitespace", "InlineComment", "MultiLineComment"]
    const filtered = tokens.filter(token => !tokensToExclude.includes(token.type));
    const timeElapsed = performance.now() - start;

    if (debugTokensToFile) {
        const res = `// Generated in ${timeElapsed}ms\n${JSON.stringify(filtered, undefined, 4)}`;
        Deno.writeTextFile("./debug/tokens.json", res);
    }

    return Ok(filtered);
}
