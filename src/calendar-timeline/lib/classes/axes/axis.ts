import { axisBottom, AxisTimeInterval, axisTop } from 'd3-axis';
import { ScaleTime, scaleTime } from 'd3-scale';
import { BaseType, Selection } from 'd3-selection';
import { Dimensions } from '../dimensions/dimensions';
import { DrawableObject } from '../drawable.object';

export class Axis extends DrawableObject {
    // todo : check the best scaletime range and output types
    protected domain: ScaleTime<number, number> = scaleTime();
    protected tickInterval: AxisTimeInterval;

    public constructor(context:  Selection<SVGGElement, any, BaseType, any>, name: string) {
        super(context, name);
    }

    public setRange(d: Dimensions): Axis {
        console.log(d.width);
        this.domain = this.domain.range([0, d.width]);
        return this;
    }

    /**
     * Set the dates of the axis bounds
     * @param dates start and end dates
     */
    public setBoundDates(dates: Date[]): Axis {
        console.log(dates);
        this.domain = this.domain.domain(dates);
        return this;
    }

    public setTickInterval(t: AxisTimeInterval) {
        this.tickInterval = t;
        return this;
    }

    /** plots the axis, if the axis has already been plotted, it's replaced. */
    public plot() {
        const axis = axisBottom(this.domain).ticks(this.tickInterval);
        super.plot();
        this.element.call(axis);
    }
}
