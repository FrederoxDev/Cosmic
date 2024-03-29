import { CosmicErrorBase } from "./Common/GenericError.ts";
import { Result } from "./Common/Result.ts";
import { LexerToken } from "./Lexer.ts";
import { BinaryOp, Group, ZeroOrMoreOf } from "./Parser/BuilderRules.ts";
import { Sequence, AnyOf, ReferenceTo } from "./Parser/BuilderRules.ts";
import { AstNode } from "./Parser/Common.ts";
import { BooleanLiteralRule, IdentifierRule, NumberLiteralRule, StringLiteralRule, SymbolRule } from "./Parser/LiteralRules.ts";
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

export const ruleSet = new RuleSet();
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

// ( "!" | "-" ) unary | primary
const unary = new AnyOf(
    new Sequence("UnaryOpNode")
        .add("op", new AnyOf(new SymbolRule("!"), new SymbolRule("-")))
        .add("rhs", new ReferenceTo("unary")),
    new ReferenceTo("primary")
);
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

const exprStmt = new AnyOf(
    new Sequence("ExprStmtNode")
        .add("expr", new ReferenceTo("expression"))
        .add(null, new SymbolRule(";"))
)
ruleSet.addRule("exprStmt", exprStmt);

const printStmt = new AnyOf(
    new Sequence("PrintStmtNode")
        .add(null, new IdentifierRule("print"))
        .add("expr", new ReferenceTo("expression"))
        .add(null, new SymbolRule(";"))
)
ruleSet.addRule("printStmt", printStmt);

const declaration = new AnyOf(new ReferenceTo("exprStmt"), new ReferenceTo("printStmt"))
ruleSet.addRule("declaration", declaration);

const program = new Sequence("ProgramNode")
    .add("declarations", new ZeroOrMoreOf(new ReferenceTo("declaration")));
ruleSet.addRule("program", program);

export function tokensToAST(
    tokens: LexerToken[], 
    writeASTtoFile: boolean, 
    excludePositionsInASTFile: boolean,
    writeGrammarToFile: boolean
): Result<AstNode, CosmicErrorBase> {
    const start = performance.now();
    const res = program.matches(ruleSet, tokens);
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