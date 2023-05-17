import { BrushBehavior, BrushSelection, D3BrushEvent } from 'd3-brush';
import { ChartAxes, ChartDimensions, HistogramData, HistogramSVGG } from '../utils/HistogramUtils';

export abstract class Brush {
    public brushContext: HistogramSVGG;
    public extent: BrushBehavior<HistogramData>;
    public isBrushed = false;
    public isBrushing = false;

    protected context: HistogramSVGG;
    protected dimensions: ChartDimensions;
    protected axes: ChartAxes;
    protected handles;

    public constructor(context: HistogramSVGG, dimensions: ChartDimensions, axes: ChartAxes) {
        this.context = context;
        this.dimensions = dimensions;
        this.axes = axes;
    }

    public size() {
        return 0;
    }

    public abstract getExtent(): BrushBehavior<HistogramData>;


    public plot(): Brush {
        this.brushContext = this.context.append('g')
            .attr('class', this.getCssName())
            .style('pointer-events', 'visible')
            .call(this.getExtent());
        this.brushContext.selectAll('.selection')
            .attr('fill-opacity', this.getFillOpacity());
        this.drawHandles();
        this.callBrushStart();
        return this;
    }

    public move([start, end]: number[]): Brush {
        this.brushContext.call(this.extent.move, [start, end]);
        return this;
    }

    public abstract onBrushEnd();

    public abstract onBrushStart();

    public abstract onBrushing();

    public abstract translateBrushHandles(selection: BrushSelection);

    public abstract getCssName();

    public abstract getFillOpacity();

    protected callBrushStart() {
        this.extent.on('start', (event: D3BrushEvent<HistogramData>) => {
            this.onBrushStart();
            const selection = event.selection;
            this.isBrushed = false;
            this.translateBrushHandles(selection);
        });
    }



    protected abstract drawHandles(): void;

}
