import { BaseType, Selection } from 'd3-selection';
import { Buckets } from './buckets';

export class BandBuckets extends Buckets {

    public constructor(context: Selection<SVGGElement, any, BaseType, any>) {
        super(context);
    }

    public plot() {
        super.plot();
        this.element
            .attr('transform', 'translate(1, 3)')
            .selectAll('dot')
            .data(this.dates)
            .enter()
            .append('rect')
            .attr('width', d => this.axis.getIntervalWidth(d) * 0.7)
            .attr('x', d => this.axis.getPosition(d) + this.axis.getIntervalWidth(d) * 0.15)
            .attr('height', 8)
            .attr('rx', 4)
            .attr('stroke-width', d => this.dynamicStrokeWidth(d))
            .style('stroke', this.colors.stroke)
            .style('fill', this.colors.fill);
    }

    public dynamicStrokeWidth(d: Date): number {
        if (this.axis.getIntervalWidth(d) < 10) {
            return 1;
        }
        return Math.round(Math.log10(this.axis.getIntervalWidth(d)));
    }
}
