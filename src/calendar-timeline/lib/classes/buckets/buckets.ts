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

    public constructor(context:  Selection<SVGGElement, any, BaseType, any>) {
        super(context, Buckets.name.toString());
    }

    public setAxis(axis: Axis): Buckets {
        this.axis = axis;
        return this;
    }

    public setData(dates: Date[]): Buckets {
        this.data = dates;
        return this;
    }

    public setColors(colors: DrawableObjectColors): Buckets {
        this.colors = colors;
        return this;
    }

}
