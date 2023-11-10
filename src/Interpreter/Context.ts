import { None, Optional } from "../Common/Optional.ts";

export class Context {
    private parent: Optional<Context>
    // Todo: Store the current scopes current variables here

    constructor() {
        this.parent = None();
    }
}