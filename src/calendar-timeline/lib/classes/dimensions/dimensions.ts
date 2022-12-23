import { Margins } from './margins';

export class Dimensions {
    public width: number;
    public height: number;

    public margins: Margins;

    public constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.margins = new Margins();
    }

    public setWidth(width: number): Dimensions {
        this.width = width;
        return this;
    }

    public setHeight(height: number): Dimensions {
        this.height = height;
        return this;
    }

    public setMargins(margins: Margins): Dimensions {
        this.margins = margins;
        return this;
    }

    public equals(d: Dimensions): boolean {
        return !!d
            && d.width === this.width
            && d.height === this.height
            && d.margins.equals(this.margins);
    }
}
