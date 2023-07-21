import { NumberNode, StringNode, BooleanNode } from "../Parser/Common.ts";
import { Node } from "./Visit.ts";

export class Number extends Node<NumberNode> {
    visit(node: NumberNode): unknown {
        return node.value;
    }
}

export class String extends Node<StringNode> {
    visit(node: StringNode): unknown {
        return node.value;
    }
}

export class Boolean extends Node<BooleanNode> {
    visit(node: BooleanNode): unknown {
        return node.value;
    }
}