import { Granularity } from '../../enumerations/granularity.enum';
import { BaseType, Selection } from 'd3-selection';
import { Axis } from '../axes/axis';
import { DrawableObject } from '../drawable.object';
import { TemporalObject } from '../temporal.object';
import { TimelineData } from 'calendar-timeline/lib/interfaces/timeline.data';

export interface DrawableObjectColors {
    stroke: string;
    fill: string;
}
export class Buckets extends TemporalObject {
    protected data: Array<TimelineData> = [];
    protected dates: Array<Date> = [];

    public constructor(context: Selection<SVGGElement, any, BaseType, any>) {
        super(context, Buckets.name.toString());
    }

    public setData(data: TimelineData[]): Buckets {
        this.data = data;
        this.dates = data.map(d => this.round(d.date));
        return this;
    }

    public getTimelineData(date: Date): TimelineData {
        const data = this.data.find(d => this.round(d.date).getTime() ===  date.getTime());
        return !!data ? data : {
            date: date,
            metadata: null
        };
    }

}
