import { Selection, BaseType } from 'd3-selection';
import { Dimensions } from './dimensions/dimensions';

export class DrawableObject {
    /** the `element` contains the drawing of this current object */
    protected element: Selection<SVGGElement, any, BaseType, any>;
    /** the context is the parent element to which the current element is appended */
    protected context: Selection<SVGGElement, any, BaseType, any>;
    protected dimensions: Dimensions;

    private name: string;

    public constructor(context: Selection<SVGGElement, any, BaseType, any>, name: string) {
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
