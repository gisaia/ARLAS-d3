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

    public abstract getExtent(): BrushBehavior<HistogramData>;


    public plot(): Brush {
        this.brushContext = this.context.append('g')
            .attr('class', 'brush')
            .style('pointer-events', 'visible')
            .call(this.getExtent());
        this.drawHandles();
        this.onBrushStart();
        return this;
    }

    public move([start, end]: number[]): Brush {
        this.brushContext.call(this.extent.move, [start, end]);
        return this;
    }

    public abstract translateBrushHandles(selection: BrushSelection);

    protected onBrushStart() {
        this.extent.on('start', (event: D3BrushEvent<HistogramData>) => {
            const selection = event.selection;
            this.isBrushed = false;
            this.translateBrushHandles(selection);
        });
    }


    protected abstract drawHandles(): void;

}
