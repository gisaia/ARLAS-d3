import { Granularity } from '../../enumerations/granularity.enum';
import { drag } from 'd3-drag';
import { BaseType, Selection } from 'd3-selection';
import { symbol } from 'd3-shape';
import { Axis } from '../axes/axis';
import { DrawableObjectColors } from '../buckets/buckets';
import { DrawableObject } from '../drawable.object';
import { Subject } from 'rxjs';

export class Cursor extends DrawableObject {
    protected axis: Axis;
    protected granularity: Granularity;
    protected colors: DrawableObjectColors;
    public selectedDate: Subject<Date> = new Subject();

    public constructor(context: Selection<SVGGElement, any, BaseType, any>) {
        super(context, Cursor.name.toString());
    }

    public setAxis(axis: Axis): Cursor {
        this.axis = axis;
        return this;
    }

    public setGranularity(granularity: Granularity): Cursor {
        this.granularity = granularity;
        this.setColors(granularity);
        return this;
    }


    public plot() {
        super.plot();
        const customSymbolCursor = {
            draw: (context, s) => {
                context.moveTo(0, s * 3 / 2);
                context.lineTo(0, s / 2);
                context.lineTo(s / 2, 0);
                context.lineTo(s, s / 2);
                context.lineTo(s, s * 3 / 2);
                context.closePath();
            }
        };
        const customCursor = symbol().type(customSymbolCursor).size(12);
        this.element
            .append('path')
            .attr('d', customCursor)
            /** todo : set the right height */
            .attr('transform', 'translate(0,' + 15 + ')')
            .style('stroke', this.colors.stroke)
            .style('stroke-width', 2)
            .style('fill', this.colors.fill);
        const dragHandler = drag()
            .on('drag', (e) => {
                /** the cursor will always be displayed on the middle of the interval
                 * Positions in between are not allowed
                 */
                const position = this.axis.getPosition(this.round(this.axis.getDate(e.x))) +
                    this.axis.getTickIntervalWidth() / 2;
                this.element
                    .select('path')
                    /**6 is half 12 the width of the cursor
                     * todo : set the right height
                     */
                    .attr('transform', 'translate(' + (position - 6) + ',' + 15 + ')');
            }
            ).on('end', (e) => {
                /** emits the date at end of drag */
                this.selectedDate.next(this.round(this.axis.getDate(e.x)));
            });
        this.element.call(dragHandler);
    }

    protected setColors(granularity: Granularity): Cursor {
        switch (granularity) {
            case Granularity.day:
                this.colors = {
                    stroke: '#4285f4',
                    fill: '#fff'
                };
                break;
            default:
                this.colors = {
                    stroke: '#4285f4',
                    fill: '#fff'
                };
        }
        return this;
    }

    private round(d: Date): Date {
        const roundedDate = new Date(d.getTime());
        switch (this.granularity) {
            case Granularity.day:
                roundedDate.setHours(0, 0, 0, 0);
                break;
            case Granularity.month:
                roundedDate.setDate(1);
                roundedDate.setHours(0, 0, 0, 0);
                break;
        }
        return roundedDate;
    }

}
