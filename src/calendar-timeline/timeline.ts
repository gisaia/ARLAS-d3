import { select } from 'd3-selection';
import { Axis } from './lib/classes/axes/axis';
import { DayAxis } from './lib/classes/axes/day.axis';
import { WeekAxis } from './lib/classes/axes/week.axis';
import { Buckets } from './lib/classes/buckets/buckets';
import { CircleBuckets } from './lib/classes/buckets/circle.buckets';
import { Dimensions } from './lib/classes/dimensions/dimensions';
import { DrawableObject } from './lib/classes/drawable.object';
import { Granularity } from './lib/enumertions/granularity.enum';

export class Timeline extends DrawableObject {

    public granularity: Granularity;
    public axis: AxisCollection;
    public buckets: BucketsCollection;
    /** todo remove */
    public mockData = [];
    public constructor(svg) {
        super(select(svg), Timeline.name.toString());
        this.axis = new AxisCollection(this.context, this.dimensions);
        this.buckets = new BucketsCollection(this.context, this.dimensions);
        // todo : remove mock data
        for (let i = 0; i < 60; i++) {
            const r = Math.ceil(Math.random() * 1000);
            if (r % 2 === 0) {
                this.mockData.push(new Date(2022, r % 4 === 0 ? 1 : 2, Math.min(Math.ceil(Math.random() * 10), 28)));
            }
        }
    }

    public setGranularity(granularity: Granularity): void {
        /** at granularity change, draw the correct axis */
        if (granularity !== this.granularity) {
            this.axis
                .setDimensions(this.dimensions)
                .update(granularity);
            this.buckets
                .update(granularity)
                /** todo get data */
                .setData(this.mockData)
                .setAxis(this.axis.get())
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
    private dimensions: Dimensions;

    public constructor(context, dimensions: Dimensions) {
        this.context = context;
        this.dimensions = dimensions;
    }

    public setDimensions(dimensions: Dimensions): AxisCollection {
        this.dimensions = dimensions;
        return this;
    }

    public update(granularity: Granularity): Axis {
        if (this.axis) {
            this.axis.remove();
            this.axis = null;
        }
        switch (granularity) {
            case Granularity.day: {
                this.axis = new DayAxis(this.context);
                this.axis.setRange(this.dimensions)
                    /**todo get bound dates */
                    .setBoundDates([new Date(2022, 1), new Date(2022, 3)])
                    .plot();
                const weekAxis = new WeekAxis(this.context);
                weekAxis
                    .setRange(this.dimensions)
                    /**todo get bound dates */
                    .setBoundDates([new Date(2022, 1), new Date(2022, 3)])
                    .plot();
            }
        }
        return this.get();

    }

    public get(): Axis {
        return this.axis;
    }
}

export class BucketsCollection {
    private buckets: Buckets;
    private context;
    private dimensions: Dimensions;

    public constructor(context, dimensions: Dimensions) {
        this.context = context;
        this.dimensions = dimensions;
    }

    public update(granularity: Granularity): Buckets {
        if (this.buckets) {
            this.buckets.remove();
            this.buckets = null;
        }
        switch (granularity) {
            case Granularity.day: {
                this.buckets = new CircleBuckets(this.context);
                this.buckets.setColors({
                    stroke: '#4285f4',
                    fill: '#fff'
                });
            }
        }
        return this.get();

    }

    public get(): Buckets {
        return this.buckets;
    }

}
