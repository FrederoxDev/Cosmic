import { CosmicErrorBase } from "./Common/GenericError.ts";
import { Result } from "./Common/Result.ts";
import { LexerToken } from "./Lexer.ts";
import { BinaryOp, Group, ZeroOrMoreOf } from "./Parser/BuilderRules.ts";
import { Sequence, AnyOf, ReferenceTo } from "./Parser/BuilderRules.ts";
import { AstNode } from "./Parser/Common.ts";
import { BooleanLiteralRule, NumberLiteralRule, StringLiteralRule, SymbolRule } from "./Parser/LiteralRules.ts";
import { RuleSet } from "./Parser/RuleSet.ts";

// expression     → equality ;
// equality       → comparison ( ( "!=" | "==" ) comparison )* ;
// comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
// term           → factor ( ( "-" | "+" ) factor )* ;
// factor         → unary ( ( "/" | "*" ) unary )* ;
// unary          → ( "!" | "-" ) unary
//                | primary ;
// primary        → NUMBER | STRING | "true" | "false" | "nil"
//                | "(" expression ")" ;

const ruleSet = new RuleSet();
const stringLiteral = new StringLiteralRule();
const numberLiteral = new NumberLiteralRule();
const booleanLiteral = new BooleanLiteralRule();

const groupedExpr = new Group(
    new Sequence()
        .add(null, new SymbolRule("("))
        .add("expr", new ReferenceTo("expression"))
        .add(null, new SymbolRule(")"))
);

const primary = new AnyOf(numberLiteral, stringLiteral, booleanLiteral, groupedExpr);
ruleSet.addRule("primary", primary);

const unary = new ReferenceTo("primary");
ruleSet.addRule("unary", unary);

const factor = new BinaryOp(new ReferenceTo("unary"), ["*", "/"]);
ruleSet.addRule("factor", factor) 

const term = new BinaryOp(new ReferenceTo("factor"), ["+", "-"]);
ruleSet.addRule("term", term)

const comparison = new BinaryOp(new ReferenceTo("term"), [">", ">=", "<", "<="]);
ruleSet.addRule("comparison", comparison)

const equality = new BinaryOp(new ReferenceTo("comparison"), ["!=", "=="]);
ruleSet.addRule("equality", equality)

const expression = new ReferenceTo("equality");
ruleSet.addRule("expression", expression);

export function tokensToAST(
    tokens: LexerToken[], 
    writeASTtoFile: boolean, 
    excludePositionsInASTFile: boolean,
    writeGrammarToFile: boolean
): Result<AstNode, CosmicErrorBase> {
    const start = performance.now();
    const res = expression.matches(ruleSet, tokens);
    const timeElapsed = performance.now() - start;

    if (!res.isOk) {
        return res
    }

    // deno-lint-ignore no-explicit-any
    const replacer = excludePositionsInASTFile ? (key: any, value: any) => {
        if (["start", "end"].includes(key)) return undefined;
        return value;
    } : undefined;
    
    if (writeASTtoFile) {
        const astStr = `// Generated in ${timeElapsed}ms\n${JSON.stringify(res.unwrap(), replacer, 4)}`;
        Deno.writeTextFile("./debug/ast.json", astStr);
    }
    if (writeGrammarToFile) {
        Deno.writeTextFile("./debug/grammar.txt", ruleSet.rulesToStr());
    }

    return res;
}