import { Selection, BaseType } from 'd3-selection';
import { Dimensions } from './dimensions/dimensions';

export class DrawableObject {
    protected context: Selection<SVGGElement, any, BaseType, any>;
    protected parentContext!: Selection<SVGGElement, any, BaseType, any>;
    protected dimensions: Dimensions;

    public constructor(context:  Selection<SVGGElement, any, BaseType, any>, parentContext?: Selection<SVGGElement, any, BaseType, any>) {
        this.context = context;
        if (!!parentContext) {
            this.parentContext = parentContext;
        }
    }

    protected setDimensions(dimensions: Dimensions): DrawableObject {
        if (!dimensions.equals(this.dimensions)) {
            // todo : redraw
        }
        this.dimensions = dimensions;
        return this;
    }

    protected appendToParent() {
        // todo : check if needed;
    }
}
