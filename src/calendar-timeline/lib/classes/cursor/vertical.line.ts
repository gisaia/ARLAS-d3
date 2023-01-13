import { BaseType, Selection } from 'd3-selection';
import { debounce, debounceTime, Subject } from 'rxjs';
import { TemporalObject } from '../temporal.object';

export class VerticalLine extends TemporalObject {

    public hoveredDate: Subject<Date> = new Subject();

    public constructor(context: Selection<SVGGElement, any, BaseType, any>) {
        super(context, VerticalLine.name.toString());
    }

    public plot(): void {
        super.plot();
        this.element.append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', this.dimensions.height)
            .style('stroke', this.colors.stroke)
            .style('stroke-width', 2)
            .style('fill', this.colors.fill);
    }

    public show() {
        this.element.style('display', 'block');
    }

    public hide() {
        this.element.style('display', 'none');
    }

    public moveTo(p: number) {
        /** the cursor will always be displayed on the middle of the interval
                 * Positions in between are not allowed
                 */
        const date = this.round(this.axis.getDate(p));
        const position = this.axis.getPosition(date) +
            this.axis.getTickIntervalWidth() / 2;
        this.element
            .select('line')
            /**6 is half 12 the width of the cursor
             * todo : set the right height
             */
            .attr('transform', 'translate(' + (position + 1) + ',' + 0 + ')');
        this.hoveredDate.next(date);
    }
}
