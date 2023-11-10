import { LexerToken } from "../Lexer.ts";

export type CosmicErrorBase = {
    type: string;
    reason: string;
    start: number; 
    end: number;
    isErrorCritical: boolean;
}

export type UnexpectedToken = CosmicErrorBase & {
    type: "UnexpectedToken",
    expectedType: string,
    actualToken: LexerToken
}

export type UnexpectedSymbol = CosmicErrorBase & {
    type: "UnexpectedSymbol",
    expectedSymbol: string,
    actualToken: LexerToken
}

export type IllegalCharacter = CosmicErrorBase & {
    type: "IllegalCharacter",
    illegalChar: string
}

export type RuntimeError = CosmicErrorBase & {
    type: "RuntimeError"
}

export type CosmicError = UnexpectedToken | IllegalCharacter | UnexpectedSymbol;