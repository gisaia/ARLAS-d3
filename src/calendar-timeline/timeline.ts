import { select } from 'd3-selection';
import { Axis } from './lib/classes/axes/axis';
import { DayAxis } from './lib/classes/axes/day.axis';
import { MonthAxis } from './lib/classes/axes/month.axis';
import { WeekAxis } from './lib/classes/axes/week.axis';
import { BandBuckets } from './lib/classes/buckets/band.buckets';
import { Buckets } from './lib/classes/buckets/buckets';
import { CircleBuckets } from './lib/classes/buckets/circle.buckets';
import { Cursor } from './lib/classes/cursor/cursor';
import { Dimensions } from './lib/classes/dimensions/dimensions';
import { DrawableObject } from './lib/classes/drawable.object';
import { Granularity } from './lib/enumerations/granularity.enum';

export class Timeline extends DrawableObject {

    public granularity: Granularity;
    public boundDates: Date[];
    public axis: AxesCollection;
    public buckets: BucketsCollection;
    public cursor: Cursor;
    public data = [];

    public constructor(svg) {
        super(select(svg), Timeline.name.toString());
        this.axis = new AxesCollection(this.context, this.dimensions);
        this.buckets = new BucketsCollection(this.context);
        this.cursor = new Cursor(this.context);
    }

    public setGranularity(granularity: Granularity): Timeline {
        this.granularity = granularity;
        return this;
    }

    public setBoundDates(dates: Date[]): Timeline {
        this.boundDates = dates;
        return this;
    }

    public setData(data): Timeline {
        this.data = data;
        return this;
    }

    public plot(): void {
        this.axis
            .setDimensions(this.dimensions)
            .update(this.granularity, this.boundDates);
        this.buckets
            .update(this.granularity)
            .setData(this.data)
            .setAxis(this.axis.get())
            .plot();
        this.cursor
            .setAxis(this.axis.get())
            .setGranularity(this.granularity)
            .plot();
    }

    public onClick(e: any): void {
        super.onClick(e);
        console.log(e);
    }
}

export class AxesCollection {
    private axis: Axis;
    private annexedAxes: Axis[] = [];
    private context;
    private dimensions: Dimensions;

    public constructor(context, dimensions: Dimensions) {
        this.context = context;
        this.dimensions = dimensions;
    }

    public setDimensions(dimensions: Dimensions): AxesCollection {
        this.dimensions = dimensions;
        return this;
    }

    public update(granularity: Granularity, boundsDate: Date[]): Axis {
        if (this.axis) {
            this.axis.remove();
            this.axis = null;
        }
        if (!!this.annexedAxes) {
            this.annexedAxes.forEach(a => {
                a.remove();
                a = null;
            });
            this.annexedAxes = [];
        }
        switch (granularity) {
            case Granularity.day:
                this.axis = new DayAxis(this.context);
                this.axis.setRange(this.dimensions)
                    .setBoundDates(boundsDate)
                    .plot();
                const weekAxis = new WeekAxis(this.context);
                weekAxis
                    .setRange(this.dimensions)
                    .setBoundDates(boundsDate)
                    .plot();
                this.annexedAxes.push(weekAxis);
                break;
            case Granularity.month:
                this.axis = new MonthAxis(this.context);
                this.axis.setRange(this.dimensions)
                    /**todo get bound dates */
                    .setBoundDates([new Date(2020, 3), new Date(2022, 3)])
                    .plot();
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

    public constructor(context) {
        this.context = context;
    }

    public update(granularity: Granularity): Buckets {
        if (this.buckets) {
            this.buckets.remove();
            this.buckets = null;
        }
        switch (granularity) {
            case Granularity.day:
                this.buckets = new CircleBuckets(this.context);
                this.buckets.setColors({
                    stroke: '#4285f4',
                    fill: '#fff'
                });
                break;
            case Granularity.month:
                this.buckets = new BandBuckets(this.context);
                this.buckets.setColors({
                    stroke: '#0097a7ff',
                    fill: '#fff'
                });
                break;
        }
        return this.get().setGranularity(granularity);

    }

    public get(): Buckets {
        return this.buckets;
    }

}
