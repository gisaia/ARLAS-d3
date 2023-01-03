import { Axis } from './axis';
import { timeDay } from 'd3-time';

export class DayAxis extends Axis {
    private DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

    public constructor(context) {
        super(context, DayAxis.name.toString());
    }

    public plot() {
        super.plot();
        this.element.selectAll('path').style('stroke', '#fff');
        this.element.selectAll('line').style('stroke', '#888');
        this.element.selectAll('text').remove();
    }

    public setTickIntervalWidth(t: number): this {
        super.setTickIntervalWidth(t);
        super.setTickSize(t * 0.7);
        return this;
    }

    public setBoundDates(dates: Date[]): Axis {
        super.setBoundDates(dates);
        const itw = this.domain(this.DAY_IN_MILLISECONDS) - this.domain(0);
        this.setTickInterval(timeDay).setTickIntervalWidth(itw);
        return this;
    }
}
