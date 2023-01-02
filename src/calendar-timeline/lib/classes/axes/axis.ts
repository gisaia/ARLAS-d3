import { axisBottom, AxisTimeInterval } from 'd3-axis';
import { NumberValue, ScaleTime, scaleTime } from 'd3-scale';
import { Axis as D3Axis } from 'd3-axis';
import { BaseType, Selection } from 'd3-selection';
import { Dimensions } from '../dimensions/dimensions';
import { DrawableObject } from '../drawable.object';

export class Axis extends DrawableObject {
    // todo : check the best scaletime range and output types
    protected domain: ScaleTime<number, number> = scaleTime();
    protected tickInterval: AxisTimeInterval;
    protected tickIntervalWidth: number;
    protected tickSize = 6 /** default value of d3 */;
    private d3Axis!: D3Axis<Date | NumberValue>;

    public constructor(context: Selection<SVGGElement, any, BaseType, any>, name: string) {
        super(context, name);
    }

    public setRange(d: Dimensions): Axis {
        this.domain = this.domain.range([0, d.width]);
        return this;
    }

    /**
     * Set the dates of the axis bounds
     * @param dates start and end dates
     */
    public setBoundDates(dates: Date[]): Axis {
        this.domain = this.domain.domain(dates);
        return this;
    }

    public setTickInterval(t: AxisTimeInterval) {
        this.tickInterval = t;
        return this;
    }

    public setTickSize(s: number) {
        this.tickSize = s;
        return this;
    }

    public setTickIntervalWidth(t: number) {
        this.tickIntervalWidth = t;
        return this;
    }

    /** plots the axis, if the axis has already been plotted, it's replaced. */
    public plot() {
        const axis = axisBottom(this.domain).ticks(this.tickInterval).tickSize(this.tickSize);
        this.d3Axis = axis;
        super.plot();
        this.element.call(axis);
    }

    public getTickIntervalWidth(): number {
        return this.tickIntervalWidth;
    }

    public getPosition(d: Date): number {
        return this.domain(d);
    }
}
