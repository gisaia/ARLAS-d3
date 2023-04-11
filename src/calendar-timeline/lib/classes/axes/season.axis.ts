import { Axis } from './axis';
import { timeDay } from 'd3-time';
import { Season } from '../season';


export class SeasonAxis extends Axis {
    private SEASON_IN_MILLISECONDS = 365 * 24 * 60 * 60 * 1000 / 4;

    public constructor(context) {
        super(context, SeasonAxis.name.toString());
        this.setTickSize(30);
        this.tickFormat = (d: Date, idx: number) => Season.getSeasonNameFromDate(d);
    }

    public plot() {
        super.plot();
        this.element.selectAll('path').style('stroke', '#fff');
        this.element.selectAll('line').style('stroke', '#888');
        this.element
            .selectAll('text')
            .attr('text-anchor', 'middle')
            .style('font-size', `${this.textFontSize}px`)
            .attr('transform', d => `translate(${this.getTickIntervalWidth() / 2}, 20)`)
            .attr('y', d => 0);
    }

    public getIntervalWidth(d: Date): number {
        const nextSeason = Season.getNextSeasonStartFromDate(d);
        return this.domain(nextSeason) - this.domain(d);
    }

    public setBoundDates(dates: Date[]): Axis {
        super.setBoundDates(dates);
        const itw = this.domain(this.SEASON_IN_MILLISECONDS) - this.domain(0);

        const timeSeason = timeDay.filter(date =>
            date.getTime() === Season.getSeasonStartFromDate(date).getTime()
        );
        this.setTickInterval(timeSeason).setTickIntervalWidth(itw);
        return this;
    }
}
