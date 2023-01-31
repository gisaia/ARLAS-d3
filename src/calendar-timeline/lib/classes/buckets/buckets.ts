import { Granularity } from '../../enumerations/granularity.enum';
import { BaseType, Selection } from 'd3-selection';
import { Axis } from '../axes/axis';
import { TemporalObject } from '../temporal.object';
import { TimelineData } from '../../interfaces/timeline.data';

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
        const dates = data.map(d => this.round(d.date));
        this.dates = [];
        for (const d of dates) {
            let isInList = false;
            for (const date of this.dates) {
                if (d.getTime() === date.getTime()) {
                    isInList = true;
                    continue;
                }
            }
            if (!isInList) {
                this.dates.push(d);
            }
        }
        return this;
    }

    public getTimelineData(date: Date): TimelineData {
        const data = this.data.find(d => this.round(d.date).getTime() ===  this.round(date).getTime());
        return !!data ? data : {
            date: this.round(date),
            id: undefined,
            metadata: undefined
        };
    }

}
