export class Context {
    variables = {}
    parent = undefined

    constructor(parent) {
        this.variables = {}
        this.parent = parent ?? undefined
    }
}