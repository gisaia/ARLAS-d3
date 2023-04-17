import { BaseType, Selection } from 'd3-selection';
import { Buckets } from './buckets';
import { TimelineData } from 'calendar-timeline/lib/interfaces/timeline.data';

export class CircleBuckets extends Buckets {

    public constructor(context: Selection<SVGGElement, TimelineData, BaseType, TimelineData>) {
        super(context);
    }

    public plot() {
        super.plot();
        this.element
            .attr('transform', 'translate(1, 3)')
            .selectAll('dot')
            .data(this.dates)
            .enter()
            .append('circle')
            .attr('r', this.axis.getTickIntervalWidth() / 2 * 0.5)
            .attr('cx', d => this.axis.getTickIntervalWidth() / 2 + this.axis.getPosition(d))
            .attr('cy', d => this.axis.getTickIntervalWidth() / 2 * 0.5)
            .style('stroke', this.colors.stroke)
            .style('fill', this.colors.fill);
    }
}
