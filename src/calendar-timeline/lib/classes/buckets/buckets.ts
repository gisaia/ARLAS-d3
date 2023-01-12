import { Granularity } from '../../enumerations/granularity.enum';
import { BaseType, Selection } from 'd3-selection';
import { Axis } from '../axes/axis';
import { DrawableObject } from '../drawable.object';

export interface DrawableObjectColors {
    stroke: string;
    fill: string;
}
export class Buckets extends DrawableObject {
    protected axis: Axis;
    protected data: Array<Date> = [];
    protected colors: DrawableObjectColors;
    protected granularity: Granularity;

    public constructor(context: Selection<SVGGElement, any, BaseType, any>) {
        super(context, Buckets.name.toString());
    }

    public setAxis(axis: Axis): Buckets {
        this.axis = axis;
        return this;
    }

    public setData(dates: Date[]): Buckets {
        this.data = dates.map(d => this.round(d));
        return this;
    }

    public setColors(colors: DrawableObjectColors): Buckets {
        this.colors = colors;
        return this;
    }

    public setGranularity(granularity: Granularity): Buckets {
        this.granularity = granularity;
        return this;
    }

    private round(d: Date): Date {
        const roundedDate = new Date(d.getTime());
        switch (this.granularity) {
            case Granularity.day:
                roundedDate.setHours(0, 0, 0, 0);
                break;
            case Granularity.month:
                roundedDate.setDate(1);
                roundedDate.setHours(0, 0, 0, 0);
                break;
        }
        return roundedDate;
    }

}
