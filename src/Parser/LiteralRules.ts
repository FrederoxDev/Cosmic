import { LexerToken } from "../Lexer.ts";
import { Err, Ok, Result } from "../Common/Result.ts";
import { AstNode, BooleanNode, NumberNode, Rule } from "./Common.ts";
import { RuleSet } from "./RuleSet.ts";
import { CosmicError, CosmicErrorBase, UnexpectedSymbol, UnexpectedToken } from "../Common/GenericError.ts";

export class StringLiteralRule implements Rule {
    matches(ruleSet: RuleSet, tokens: LexerToken[]): Result<AstNode, CosmicError> {
        if (tokens.length === 0) throw new Error("No tokens!");
        const token = tokens.shift()!;
        
        if (token.type === "StringLiteral") return Ok({
            type: "StringNode",
            value: token.value,
            start: token.start,
            end: token.end,
        });

        return Err({
            type: "UnexpectedToken",
            reason: `Expected token 'StringLiteral' instead got token ${token.type}`,
            actualToken: token,
            expectedType: `StringLiteral`,
            start: token.start,
            end: token.end,
            isErrorCritical: false
        } as UnexpectedToken)
    }
    
    toGrammar(ruleSet: RuleSet, depth: number): string {
        return `StringLiteral`
    }
}

export class NumberLiteralRule implements Rule {
    matches(ruleSet: RuleSet, tokens: LexerToken[]): Result<NumberNode, CosmicError> {
        if (tokens.length === 0) throw new Error("No tokens!");
        const token = tokens.shift()!;
        
        if (token.type === "NumberLiteral") return Ok({
            type: "NumberNode",
            value: token.value,
            start: token.start,
            end: token.end
        });

        return Err({
            type: "UnexpectedToken",
            reason: `Expected token 'NumberLiteral' instead got token ${token.type}`,
            actualToken: token,
            expectedType: `NumberLiteral`,
            start: token.start,
            end: token.end,
            isErrorCritical: false
        } as UnexpectedToken)
    }

    toGrammar(ruleSet: RuleSet, depth: number): string {
        return `NumberLiteral`
    }
}

export class BooleanLiteralRule implements Rule {
    matches(ruleSet: RuleSet, tokens: LexerToken[]): Result<BooleanNode, CosmicError> {
        if (tokens.length === 0) throw new Error("No tokens!");
        const token = tokens.shift()!;
        
        if (token.type === "BooleanLiteral") return Ok({
            type: "BooleanNode",
            value: token.value,
            start: token.start,
            end: token.end
        });

        return Err({
            type: "UnexpectedToken",
            reason: `Expected token 'BooleanLiteral' instead got token ${token.type}`,
            actualToken: token,
            expectedType: `BooleanLiteral`,
            start: token.start,
            end: token.end,
            isErrorCritical: false
        } as UnexpectedToken)
    }

    toGrammar(ruleSet: RuleSet, depth: number): string {
        return `BooleanLiteral`
    }
}

export class SymbolRule implements Rule {
    symbol: string;

    constructor(symbol: string) {
        this.symbol = symbol;
    }

    matches(ruleSet: RuleSet, tokens: LexerToken[]): Result<AstNode, CosmicError> {
        if (tokens.length === 0) throw new Error("No tokens!");
        const token = tokens.shift()!;

        if (token.type === "Symbol") {
            if (token.value === this.symbol) return Ok({
                type: "Symbol",
                value: token.value,
                start: token.start,
                end: token.end
            })

            return Err({
                type: "UnexpectedSymbol",
                reason: `Expected symbol '${this.symbol}' instead got ${token.value}`,
                actualToken: token,
                expectedSymbol: this.symbol,
                start: token.start,
                end: token.end,
                isErrorCritical: false
            } as UnexpectedSymbol)
        }

        return Err({
            type: "UnexpectedToken",
            reason: `Expected "${this.symbol}" instead got token ${token.type}`,
            actualToken: token,
            expectedType: `Symbol`,
            start: token.start,
            end: token.end
        } as UnexpectedToken)
    }

    toGrammar(ruleSet: RuleSet, depth: number): string {
        return `"${this.symbol}"`
    }
}

export class IdentifierRule implements Rule {
    identifier: string;

    constructor(identifier: string) {
        this.identifier = identifier;
    }

    matches(ruleSet: RuleSet, tokens: LexerToken[]): Result<AstNode, CosmicError> {
        if (tokens.length === 0) throw new Error("No tokens!");
        const token = tokens.shift()!;

        if (token.type === "Identifier") {
            if (token.value === this.identifier) return Ok({
                type: "Identifier",
                value: token.value,
                start: token.start,
                end: token.end
            })

            return Err({
                type: "UnexpectedSymbol",
                reason: `Expected symbol '${this.identifier}' instead got ${token.value}`,
                actualToken: token,
                expectedSymbol: this.identifier,
                start: token.start,
                end: token.end,
                isErrorCritical: false
            } as UnexpectedSymbol)
        }

        return Err({
            type: "UnexpectedToken",
            reason: `Expected "${this.identifier}" instead got token ${token.type}`,
            actualToken: token,
            expectedType: `Symbol`,
            start: token.start,
            end: token.end
        } as UnexpectedToken)
    }

    toGrammar(ruleSet: RuleSet, depth: number): string {
        return `"${this.identifier}"`
    }
}