import { select } from 'd3-selection';
import { Subject } from 'rxjs';
import { Axis } from './lib/classes/axes/axis';
import { DayAxis } from './lib/classes/axes/day.axis';
import { MonthAxis } from './lib/classes/axes/month.axis';
import { WeekAxis } from './lib/classes/axes/week.axis';
import { BandBuckets } from './lib/classes/buckets/band.buckets';
import { Buckets } from './lib/classes/buckets/buckets';
import { CircleBuckets } from './lib/classes/buckets/circle.buckets';
import { Cursor } from './lib/classes/cursor/cursor';
import { VerticalLine } from './lib/classes/cursor/vertical.line';
import { Dimensions } from './lib/classes/dimensions/dimensions';
import { DrawableObject } from './lib/classes/drawable.object';
import { Granularity } from './lib/enumerations/granularity.enum';
import { Bucket } from './lib/interfaces/bucket';
import { TimelineData, TimelineTooltip } from './lib/interfaces/timeline.data';

export class Timeline extends DrawableObject {

    public granularity: Granularity;
    public boundDates: Date[];
    public axis: AxesCollection;
    public buckets: BucketsCollection;
    public cursor: Cursor;
    public verticalLine: VerticalLine;
    public data: TimelineData[] = [];
    public hoveredData: Subject<TimelineTooltip> = new Subject();
    public selectedData: Subject<TimelineData> = new Subject();

    public constructor(svg) {
        super(select(svg), Timeline.name.toString());

        this.axis = new AxesCollection(this.context, this.dimensions);
        this.buckets = new BucketsCollection(this.context);
        this.cursor = new Cursor(this.context);
        this.verticalLine = new VerticalLine(this.context);

        this.context.on('click', (e) => this.onClick(e));
        this.context.on('mouseenter', (e) => this.onMouseenter(e));
        this.context.on('mouseleave', (e) => this.onMouseleave(e));
        this.context.on('mousemove', (e) => this.onMousemove(e));

        this.cursor.hoveredBucket.subscribe({
            next: (b: Bucket) => {
                this.hoveredData.next({
                    data: this.buckets.get().getTimelineData(b.date),
                    position: b.position,
                    shown: b.show,
                    width: this.dimensions.width
                });
            }
        });

        this.cursor.selectedDate.subscribe({
            next: (d: Date) => {
                this.selectedData.next(this.buckets.get().getTimelineData(d));
            }
        });
        this.verticalLine.hoveredBucket.subscribe({
            next: (b: Bucket) => {
                console.log(b);
                this.hoveredData.next({
                    data: this.buckets.get().getTimelineData(b.date),
                    position: b.position,
                    shown: b.show,
                    width: this.dimensions.width
                });
            }
        });

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
        this.verticalLine
            .setAxis(this.axis.get())
            .setGranularity(this.granularity)
            .setDimensions(this.dimensions)
            .plot();
        this.buckets
            .update(this.granularity)
            .setData(this.data)
            .setAxis(this.axis.get())
            .plot();
        this.cursor
            .setVerticalLine(this.verticalLine)
            .setAxis(this.axis.get())
            .setGranularity(this.granularity)
            .plot();
    }

    public onClick(e: PointerEvent): void {
        super.onClick(e);
        this.cursor.moveTo(e.offsetX);
    }

    public onMouseenter(e: PointerEvent): void {
        this.verticalLine.show();
    }
    public onMouseleave(e: PointerEvent): void {
        this.verticalLine.hide();
        this.hoveredData.next({
            data: null,
            position: 0,
            shown: false,
            width: this.dimensions.width
        });
    }

    public onMousemove(e: PointerEvent): void {
        this.verticalLine.moveTo(e.offsetX);
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
                break;
            case Granularity.month:
                this.buckets = new BandBuckets(this.context);
                break;
        }
        return this.get().setGranularity(granularity) as Buckets;

    }

    public get(): Buckets {
        return this.buckets;
    }

}
