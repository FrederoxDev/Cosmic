export class Literal<T> {
    value: T

    constructor(value: T) {
        this.value = value
    }

    inspect() {
        return this.value
    }
}