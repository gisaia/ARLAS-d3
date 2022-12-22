export class Margins {
    public top = 0;
    public bottom = 0;
    public left = 0;
    public right = 0;

    public setTop(top: number): Margins {
        this.top = top;
        return this;
    }

    public setBottom(bottom: number): Margins {
        this.bottom = bottom;
        return this;
    }

    public setLeft(left: number): Margins {
        this.left = left;
        return this;
    }

    public equals(m: Margins): boolean {
        return !!m
            && m.bottom === this.bottom
            && m.top === this.top
            && m.left === this.left
            && m.right === this.right;
    }

    public setRight(right: number): Margins {
        this.right = right;
        return this;
    }
}
