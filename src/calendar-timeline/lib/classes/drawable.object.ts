import { Selection, BaseType } from 'd3-selection';
import { Dimensions } from './dimensions/dimensions';
import { TimelineData } from '../interfaces/timeline.data';

export class DrawableObject {
    /** the `element` contains the drawing of this current object */
    protected element: Selection<SVGGElement, TimelineData, BaseType, TimelineData>;
    /** the context is the parent element to which the current element is appended */
    protected context: Selection<SVGGElement, TimelineData, BaseType, TimelineData>;
    protected dimensions: Dimensions;

    private name: string;

    public constructor(context: Selection<SVGGElement, TimelineData, BaseType, TimelineData>, name: string) {
        this.context = context;
        this.name = name;
        /** Listen to events */
    }

    public plot() {
        this.remove();
        this.element = this.context
            .append('g');
        this.element.attr('class', this.name);
    }

    public remove() {
        if (!!this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    public setDimensions(dimensions: Dimensions): DrawableObject {
        if (!dimensions.equals(this.dimensions)) {
            // todo : redraw
        }
        this.dimensions = dimensions;
        return this;
    }

    public onClick(e): void {
    }


}
