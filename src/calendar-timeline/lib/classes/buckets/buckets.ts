import { Granularity } from '../../enumerations/granularity.enum';
import { BaseType, Selection } from 'd3-selection';
import { Axis } from '../axes/axis';
import { DrawableObject } from '../drawable.object';
import { TemporalObject } from '../temporal.object';

export interface DrawableObjectColors {
    stroke: string;
    fill: string;
}
export class Buckets extends TemporalObject {
    protected data: Array<Date> = [];


    public constructor(context: Selection<SVGGElement, any, BaseType, any>) {
        super(context, Buckets.name.toString());
    }

    public setData(dates: Date[]): Buckets {
        this.data = dates.map(d => this.round(d));
        return this;
    }

}
