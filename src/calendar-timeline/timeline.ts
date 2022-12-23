import { select } from 'd3-selection';
import { Axis } from './lib/classes/axes/axis';
import { DayAxis } from './lib/classes/axes/day.axis';
import { DrawableObject } from './lib/classes/drawable.object';
import { Granularity } from './lib/enumertions/granularity.enum';

export class Timeline extends DrawableObject {

    public granularity: Granularity;
    public axis: AxisCollection;

    public constructor(svg) {
        super(select(svg), Timeline.name.toString());
        this.axis = new AxisCollection(this.context);
    }

    public setGranularity(granularity: Granularity): void {
        /** at granularity change, draw the correct axis */
        if (granularity !== this.granularity) {
            this.axis
                .update(granularity)
                .setRange(this.dimensions)
                /**todo get bound dates */
                .setBoundDates([new Date(2022, 1), new Date(2022, 3)])
                .plot();
        }
        this.granularity = granularity;
    }

    public setBuckets(buckets) {
        // todo draw new arrived buckets on timeline
    }



}


export class AxisCollection {
    private axis: Axis;
    private context;

    public constructor(context) {
        this.context = context;
    }

    public update(granularity: Granularity): Axis {
        if (this.axis) {
            this.axis.remove();
            this.axis = null;
        }
        switch (granularity) {
            case Granularity.day: {
                this.axis = new DayAxis(this.context);
            }
        }
        return this.get();

    }

    public get(): Axis {
        return this.axis;
    }
}
