import { Granularity } from '../../enumerations/granularity.enum';
import { drag } from 'd3-drag';
import { BaseType, Selection } from 'd3-selection';
import { symbol } from 'd3-shape';
import { Axis } from '../axes/axis';
import { DrawableObjectColors } from '../buckets/buckets';
import { Subject } from 'rxjs';
import { TemporalObject } from '../temporal.object';
import { VerticalLine } from './vertical.line';
import { Bucket } from '../../interfaces/bucket';

export class Cursor extends TemporalObject {
    public selectedDate: Subject<Date> = new Subject();
    public verticalLine: VerticalLine;
    public hoveredBucket: Subject<Bucket> = new Subject();
    private cursorOffset: number;

    public constructor(context: Selection<SVGGElement, any, BaseType, any>, granularity: Granularity) {
        super(context, Cursor.name.toString());
        this.setCursorOffset(granularity);
    }

    public setCursorOffset(granularity: Granularity) {
        this.cursorOffset = 15;
        switch (granularity) {
            case Granularity.day:
                // Add the margin
                this.cursorOffset += 3;
                break;
            case Granularity.month:
                // Add the tick offset + font size + margin
                this.cursorOffset += 20 + 12 + 3;
                break;
            case Granularity.season:
                // Add the tick offset
                this.cursorOffset += 20;
                break;
            case Granularity.year:
                // Add the tick offset
                this.cursorOffset += 20;
                break;
        }
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
            .attr('transform', 'translate(0,' + this.cursorOffset + ')')
            .style('cursor', 'pointer')
            .style('stroke', this.colors.stroke)
            .style('stroke-width', 2)
            .style('fill', this.colors.fill);
        const dragHandler = drag()
            .on('drag', (e) => {
                this.moveTo(e.x);
                const position = this.axis.getPosition(this.round(this.axis.getDate(e.x))) +
                    this.axis.getTickIntervalWidth() / 2;
                this.hoveredBucket.next({
                    date: this.round(this.axis.getDate(e.x)),
                    position,
                    show: true
                });
                this.verticalLine.hide();
            }
            ).on('end', (e) => {
                /** emits the date at end of drag */
                this.selectedDate.next(this.round(this.axis.getDate(e.x)));
                this.verticalLine.moveTo(e.offsetX);
                this.verticalLine.show();

            });
        this.element.call(dragHandler);
        this.element.on('mouseenter', (e) => this.onMouseenter(e));
        this.element.on('mouseleave', (e) => this.onMouseleave(e));
        this.element.on('mousemove', (e) => this.onMousemove(e));
    }

    public moveTo(p: number) {
        /** the cursor will always be displayed on the middle of the interval
                 * Positions in between are not allowed
                 */
        const position = this.axis.getPosition(this.round(this.axis.getDate(p))) +
            this.axis.getTickIntervalWidth() / 2;
        this.element
            .select('path')
            /**6 is half 12 the width of the cursor
             * todo : set the right height
             */
            .attr('transform', 'translate(' + (position - 5) + ',' + this.cursorOffset + ')');
    }

    public onMouseenter(e: PointerEvent): void {
        e.stopPropagation();
        this.verticalLine.hide();
    }
    public onMouseleave(e: PointerEvent): void {
        this.verticalLine.show();
        e.stopPropagation();
    }

    public onMousemove(e: PointerEvent): void {

    }


    public setVerticalLine(verticalLine: VerticalLine): Cursor {
        this.verticalLine = verticalLine;
        return this;
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

}
