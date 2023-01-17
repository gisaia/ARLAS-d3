import { Axis } from './axis';
import { timeYear } from 'd3-time';

export class YearAxis extends Axis {
    private YEAR_IN_MILLISECONDS = 365 * 24 * 60 * 60 * 1000;

    public constructor(context) {
        super(context, YearAxis.name.toString());
        this.setTickSize(20);
    }

    public plot() {
        super.plot();
        this.element.selectAll('path').style('stroke', '#fff');
        this.element.selectAll('line').style('stroke', '#888');
        this.element
            .selectAll('text')
            .attr('text-anchor', 'start')
            .style('font-size', '12px')
            .attr('transform', d => `translate(${this.getTickIntervalWidth() / 2 -
                12 /** font size */}, 20)`)
            .attr('y', d => 0);
    }

    public getIntervalWidth(d: Date): number {
        const nextYear = new Date(d.getFullYear() + 1, 0, 1);
        return this.domain(nextYear) - this.domain(d);
    }

    public setBoundDates(dates: Date[]): Axis {
        const bounds = dates.map((date, idx, arr) => {
            const newDate = new Date(date.getTime());
            if (idx === 0) {
                newDate.setMonth(0);
                newDate.setDate(1);
                newDate.setHours(0, 0, 0, 0);
            } else if (idx === arr.length - 1) {
                newDate.setFullYear(newDate.getFullYear() + 1, 0, 1);
                newDate.setHours(0, 0, 0, 0);
            }
            return newDate;
        })
        super.setBoundDates(bounds);
        const itw = this.domain(this.YEAR_IN_MILLISECONDS) - this.domain(0);
        this.setTickInterval(timeYear).setTickIntervalWidth(itw);
        return this;
    }
}
