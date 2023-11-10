export abstract class Type {
    abstract name: string;

    add(rhs: Type): unknown {
        throw new Error(`${this.name} does not implement operator +`)
    }

    sub(rhs: Type): unknown {
        throw new Error(`${this.name} does not implement operator -`)
    }

    mul(rhs: Type): unknown {
        throw new Error(`${this.name} does not implement operator *`)
    }

    div(rhs: Type): unknown {
        throw new Error(`${this.name} does not implement operator /`)
    }
}

export class NumberType extends Type {
    name = "Number";
    value: number;

    constructor(value: number) {
        super();
        this.value = value;
    }

    add(rhs: Type): unknown {
        if (rhs.name != "Number") 
            throw new Error(`${this.name} does not support rhs of type ${rhs.name}`);

        return new NumberType(this.value + (rhs as NumberType).value);
    }
}