import { axisBottom, AxisTimeInterval } from 'd3-axis';
import { NumberValue, ScaleTime, scaleTime } from 'd3-scale';
import { Axis as D3Axis } from 'd3-axis';
import { BaseType, Selection } from 'd3-selection';
import { Dimensions } from '../dimensions/dimensions';
import { DrawableObject } from '../drawable.object';
import { TimelineData } from '../../interfaces/timeline.data';

export class Axis extends DrawableObject {
    // todo : check the best scaletime range and output types
    protected domain: ScaleTime<number, number> = scaleTime();
    protected tickInterval: AxisTimeInterval;
    protected tickIntervalWidth: number;
    protected tickSize = 6 /** default value of d3 */;
    protected tickFormat: (domainValue: Date | NumberValue, index: number) => string;
    protected axisXOffset: number;
    protected axisYOffset: number;
    protected textFontSize: number;
    private d3Axis!: D3Axis<Date | NumberValue>;

    public constructor(context: Selection<SVGGElement, TimelineData, BaseType, TimelineData>, name: string) {
        super(context, name);
        this.tickFormat = null;
        this.axisYOffset = 0;
        this.axisXOffset = 0;
        this.textFontSize = 12;
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

    public setAxisYOffset(axisYOffset: number): Axis {
        this.axisYOffset = axisYOffset;
        return this;
    }

    public setTextFontSize(textFontSize: number): Axis {
        this.textFontSize = textFontSize;
        return this;
    }

    /** plots the axis, if the axis has already been plotted, it's replaced. */
    public plot() {
        const axis = axisBottom(this.domain).ticks(this.tickInterval)
                                            .tickSize(this.tickSize)
                                            .tickFormat(this.tickFormat);
        this.d3Axis = axis;
        super.plot();
        this.element.attr('transform', `translate(${this.axisXOffset}, ${this.axisYOffset})`)
            .call(axis);
        this.element
        .selectAll('text')
        .style('font-size', `${this.textFontSize}px`)
        .style('text-transform', 'uppercase');
    }

    public getTickIntervalWidth(): number {
        return this.tickIntervalWidth;
    }

    public getIntervalWidth(d: Date): number {
        return NaN;
    }

    public getPosition(d: Date): number {
        return this.domain(d);
    }

    public getDate(d: number): Date {
        return this.domain.invert(d);
    }
}
