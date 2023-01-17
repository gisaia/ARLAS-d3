import { Axis } from './axis';
import { timeWeek } from 'd3-time';

export class WeekAxis extends Axis {
    private WEEK_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

    public constructor(context) {
        super(context, WeekAxis.name.toString());
        this.setTickSize(45);
    }

    public plot() {
        super.plot();
        this.element.selectAll('path').style('stroke', '#fff');
        this.element.selectAll('line').style('stroke', '#888');
        this.element.selectAll('text').attr('transform', 'translate(20, -10)');

    }



    public setBoundDates(dates: Date[]): Axis {
        super.setBoundDates(dates);
        this.setTickInterval(timeWeek);
        return this;
    }
}
