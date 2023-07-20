export function Ok<T, E>(data: T): Result<T, E> {
    return new Result<T, E>(true, data, undefined);
}

export function Err<T, E>(message: E): Result<T, E> {
    return new Result<T, E>(false, undefined, message);
}

export class Result<T, E> {
    public isOk: boolean
    private data: T | undefined
    private error: E | undefined

    constructor(isOk: boolean, data: T | undefined, error: E | undefined) {
        this.isOk = isOk;
        this.data = data;
        this.error = error;
    }

    expect(errMessage: string): T {
        if (this.isOk) return this.data!;
        throw new Error(errMessage);
    }

    unwrap(): T {
        if (this.isOk === true) {
            return this.data!;
        }
        else {
            throw this.error;
        }
    }

    unwrapErr(): E {
        if (!this.isOk) return this.error!;
        throw new Error(`Tried to unwrap an error when there was none!`);
    }
}