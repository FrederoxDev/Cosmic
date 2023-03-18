import { StatementCommon } from "./Parser";

/**
 * Analyses code for type's which can be used for intellisense
 */
export class StaticAnalysis {
    ast: StatementCommon;

    constructor (ast: StatementCommon) {
        this.ast = ast;
    }
}