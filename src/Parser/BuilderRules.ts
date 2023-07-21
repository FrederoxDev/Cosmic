import { CosmicError, UnexpectedToken } from "../Common/GenericError.ts";
import { Err, Result, Ok } from "../Common/Result.ts";
import { LexerToken } from "../Lexer.ts";
import { AstNode, BinOpNode, Rule, SymbolNode, TZeroOrMoreOf } from "./Common.ts";
import { SymbolRule } from "./LiteralRules.ts";
import { RuleSet } from "./RuleSet.ts";

export class Sequence implements Rule {
    rules: [string | null, Rule][] = [];
    typeName: string;

    constructor(typeName: string | undefined = undefined) {
        this.typeName = typeName ?? "Sequence";
    }

    add(identifier: string | null, rule: Rule) {
        this.rules.push([identifier, rule]);
        return this
    }

    matches(ruleSet: RuleSet, tokens: LexerToken[]): Result<AstNode, CosmicError> {
        const result: {[key: string]: unknown} = {};
        let start: number | undefined = undefined;
        let end: number;

        if (this.rules.length === 0) throw new Error("Unable to have sequence with no rules!");
        let critical = false;

        for (let i = 0; i < this.rules.length; i++) {
            const [name, rule] = this.rules[i];
            const match = rule.matches(ruleSet, tokens);
            if (!match.isOk) {
                const err = match.unwrapErr();

                if (!err.isErrorCritical && critical) 
                    err.isErrorCritical = true;

                return Err(err);
            }
            const unwrapped = match.unwrap()

            if (start === undefined) start = unwrapped.start;
            end = unwrapped.end;
            
            if (name != undefined) {
                if (match.unwrap().type === "ZeroOrMoreOf") {
                    result[name] = (match.unwrap() as TZeroOrMoreOf).matches;
                }
                else result[name] = unwrapped;
            }

            critical = true;
        }

        return Ok({
            type: this.typeName,
            start: start!,
            end: end!,
            ...result
        });
    }
    
    toGrammar(ruleSet: RuleSet, depth: number): string {
        const ruleStrings = this.rules.map(rule => rule[1].toGrammar(ruleSet, depth + 1));
        return ruleStrings.join(" ");
    }
}

export class AnyOf implements Rule {
    rules: Rule[];

    constructor(...rest: Rule[]) {
        this.rules = rest;
    }

    matches(ruleSet: RuleSet, tokens: LexerToken[]): Result<AstNode, CosmicError> {
        const tokenCopy = tokens.slice();

        for (let i = 0; i < this.rules.length; i++) {
            const match = this.rules[i].matches(ruleSet, tokens);
            if (match.isOk) return match;
            if (match.unwrapErr().isErrorCritical) {
                console.log("Critical!")
                return match;
            }

            tokens.length = 0;
            tokens.push(...tokenCopy);
        }

        return Err({
            type: "UnexpectedToken",
            reason: `Expected type of '${this.toGrammar(ruleSet, 0)}' instead got '${tokens[0].type}'`,
            actualToken: tokens[0],
            expectedType: this.toGrammar(ruleSet, 0),
            start: tokens[0].start,
            end: tokens[0].end
        } as UnexpectedToken)
    }

    toGrammar(ruleSet: RuleSet, depth: number): string {
        const ruleStrings = this.rules.map(rule => rule.toGrammar(ruleSet, depth + 1));

        if (depth < 1) return ruleStrings.join(" | ")
        return `( ${ruleStrings.join(" | ")} )`
    }
}

export class ReferenceTo implements Rule {
    id: string;

    constructor(id: string) {
        this.id = id;
    }

    matches(ruleSet: RuleSet, tokens: LexerToken[]): Result<AstNode, CosmicError> {
        return ruleSet.getRule(this.id).matches(ruleSet, tokens);
    }

    toGrammar(ruleSet: RuleSet, depth: number): string {
        if (depth >= 0) return `${this.id}`;
        return ruleSet.getRule(this.id).toGrammar(ruleSet, depth + 1)
    }
}

export class ZeroOrMoreOf implements Rule {
    rule: Rule;

    constructor(rule: Rule) {
        this.rule = rule;
    }

    matches(ruleSet: RuleSet, tokens: LexerToken[]): Result<AstNode, CosmicError> {
        const matches: AstNode[] = [];
        let start: null | number = null; 
        let end: number | null = null;

        while (true) {
            if (start === null) start = tokens[0].start;
            const tokenCopy = tokens.slice();
            const match = this.rule.matches(ruleSet, tokens);

            if (!match.isOk) {
                tokens.length = 0;
                tokens.push(...tokenCopy);

                if (match.unwrapErr().isErrorCritical) return match;

                return Ok({
                    type: "ZeroOrMoreOf",
                    matches,
                    start,
                    end: end ?? start
                });
            } 
            
            matches.push(match.unwrap());
            end = match.unwrap().end;

            if (tokens.length === 0) {
                return Ok({
                    type: "ZeroOrMoreOf",
                    matches,
                    start,
                    end: end ?? start
                });
            }
        }
    }

    toGrammar(ruleSet: RuleSet, depth: number): string {
        if (depth === 0) return `${this.rule.toGrammar(ruleSet, depth + 1)}*`
        return `( ${this.rule.toGrammar(ruleSet, depth + 1)} )*`
    }
}

export class Group implements Rule {
    rule: Rule;
    
    constructor(rule: Rule) {
        this.rule = rule;
    }

    matches(ruleSet: RuleSet, tokens: LexerToken[]): Result<AstNode,CosmicError> {
        const match = this.rule.matches(ruleSet, tokens);
        if (!match.isOk) return match;

        const unwrapped = match.unwrap() as unknown as { expr: AstNode };
        return Ok(unwrapped.expr);
    }

    toGrammar(ruleSet: RuleSet, depth: number): string {
        return this.rule.toGrammar(ruleSet, depth);
    }
        
}

export class BinaryOp implements Rule {
    rule: Rule;

    constructor(lhs: Rule, operators: string[], rhs: Rule = lhs) {
        this.rule = new Sequence()
            .add("lhs", lhs)
            .add("rhs_matches", new ZeroOrMoreOf(
                new Sequence()
                    .add("op", new AnyOf(...operators.map(op => new SymbolRule(op))))
                    .add("rhs", rhs)
            ))
    }

    matches(ruleSet: RuleSet, tokens: LexerToken[]): Result<AstNode, CosmicError> {
        const match = this.rule.matches(ruleSet, tokens);
        if (!match.isOk) return match;

        const result = match.unwrap() as unknown as { lhs: AstNode, rhs_matches: AstNode[]};
        if (result.rhs_matches.length === 0) return Ok(result.lhs);
        let lhs: BinOpNode | AstNode = result.lhs;

        for (let i = 0; i < result.rhs_matches.length; i++) {
            const match = result.rhs_matches[i] as unknown as { op: SymbolNode, rhs: AstNode };

            lhs = {
                type: "BinOpNode",
                start: lhs.start,
                end: match.rhs.end,
                lhs,
                op: match.op,
                rhs: match.rhs
            }
        }

        return Ok(lhs);
    }

    toGrammar(ruleSet: RuleSet, depth: number): string {
        return this.rule.toGrammar(ruleSet, depth);
    }
}