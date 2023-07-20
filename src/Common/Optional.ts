export function Some<T>(data: T): Optional<T> {
    return new Optional(true, data);
}

export function None<T>(): Optional<T> {
    return new Optional<T>(false, undefined);
}

export class Optional<T> {
    public isSome: boolean;
    private data: T | undefined;

    constructor(isSome: boolean, data: T | undefined) {
        this.isSome = isSome;
        this.data = data;
    }

    expect(errMessage: string): T {
        if (this.isSome) return this.data!;
        throw new Error(errMessage);
    }

    unwrap(): T {
        if (this.isSome) return this.data!;
        throw new Error("Cannot unwrap None");
    }
}