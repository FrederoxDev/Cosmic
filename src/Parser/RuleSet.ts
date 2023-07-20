import { Rule } from "./Common.ts";

export class RuleSet {
    rules: {[key: string]: Rule}  = {};

    addRule(id: string, rule: Rule) {
        this.rules[id] = rule;
    }

    getRule(id: string): Rule {
        const rule = this.rules[id];
        if (rule === undefined) throw new Error("Invalid rule name " + id)
        return rule
    }

    rulesToStr(startingDepth = 0): string {
        const keys = Object.keys(this.rules);
        const grammar = []

        for (let i = 0; i < keys.length; i++) {
            grammar.push(`${keys[i]} → ${this.getRule(keys[i]).toGrammar(this, startingDepth)} ;`)
        }

        return grammar.join("\n")
    }
}