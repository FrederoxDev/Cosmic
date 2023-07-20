import { LexerToken } from "../Lexer.ts";
import { Optional } from "../Common/Optional.ts";
import { Result } from "../Common/Result.ts"
import { RuleSet } from "./RuleSet.ts";
import { CosmicError } from "../Common/GenericError.ts";

export interface Rule {
    matches(ruleSet: RuleSet, tokens: LexerToken[]): Result<AstNode, CosmicError>;
    toGrammar(ruleSet: RuleSet, depth: number): string;
}

export interface AstNode { type: string, start: number, end: number }

export type StringNode = AstNode & { type: "StringNode", value: string };
export type NumberNode = AstNode & { type: "NumberNode", value: string };
export type BooleanNode = AstNode & { type: "BooleanNode", value: string }; 

export type UnionNode = StringNode | NumberNode | BooleanNode | BinOpNode;

// Utility
export type TZeroOrMoreOf = AstNode & { type: "ZeroOrMoreOf", matches: AstNode[] }
export type SymbolNode = AstNode & { type: "SymbolNode", value: string };
export type BinOpNode = AstNode & { type: "BinOpNode", lhs: AstNode, op: string, rhs: AstNode }