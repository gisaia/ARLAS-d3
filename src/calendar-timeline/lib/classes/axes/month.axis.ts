import { Axis } from './axis';
import { timeMonth } from 'd3-time';

export class MonthAxis extends Axis {
    private MONTH_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;

    public constructor(context) {
        super(context, MonthAxis.name.toString());
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
            .attr('transform', d => `translate(${this.getTickIntervalWidth() / 2 +
                6 /** size font / 2 */ }, 20) rotate(90)`)
            .attr('y', d => 0);
    }

    public getIntervalWidth(d: Date): number {
        const nextMonth = d.getMonth() === 11 ?
            new Date(d.getFullYear() + 1, 0, 1) :
            new Date(d.getFullYear(), d.getMonth() + 1, 1);
        return this.domain(nextMonth) - this.domain(d);
    }


    public setBoundDates(dates: Date[]): Axis {
        super.setBoundDates(dates);
        const itw = this.domain(this.MONTH_IN_MILLISECONDS) - this.domain(0);
        this.setTickIntervalWidth(itw);
        this.setTickInterval(timeMonth);
        return this;
    }
}
