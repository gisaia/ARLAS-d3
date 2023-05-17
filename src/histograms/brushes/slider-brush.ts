import { HistogramData, HistogramSVGG } from 'histograms/utils/HistogramUtils';
import { Brush } from './brush';
import { BrushBehavior, BrushSelection, brushX } from 'd3-brush';

export class SliderBrush extends Brush {

    public handleRadius: number;
    public lineContext: HistogramSVGG;
    private strokeWidth = 1.5;

    public setHandleRadius(handleRadius): SliderBrush {
        this.handleRadius = handleRadius;
        return this;
    }

    public size(): number {
        const enlargementRatio = 1.7;
        return this.handleRadius * enlargementRatio + 2;
    }

    public plot() {
        const y0Position = this.axes.yDomain(0);
        this.lineContext = this.context
            .append('line')
            .attr('y1', y0Position)
            .attr('y2', y0Position)
            .style('stroke', '#000')
            .attr('stroke-width', this.strokeWidth);
        return super.plot();;
    }

    public getExtent(): BrushBehavior<HistogramData> {
        if (!this.extent) {
            this.extent = brushX<HistogramData>().extent([
                [0, 0],
                [this.dimensions.width, this.dimensions.height]
            ]);
        }
        return this.extent;
    }

    public move([start, end]: number[]): Brush {
        return super.move([start, end]);
    }

    public translateBrushHandles(selection: BrushSelection) {
        if (selection !== null) {
            this.handles.attr('display', null).attr('transform', (d, i) =>
                'translate(' + [selection[i], 0] + ')');
            this.lineContext.selection()
                .attr('x1', selection[0])
                .attr('x2', selection[1]);
        } else {
            this.handles.attr('display', 'none');
        }
    }

    public onBrushEnd() {
        this.setHandleStyle();
    }

    public onBrushStart() {
    }

    public onBrushing() {
        this.setHoveredHandleStyle();
    }

    public getCssName(): string {
        return 'slider-brush';
    }

    public getFillOpacity(): number {
        return 0;
    }


    protected drawHandles(): void {
        const y0Position = this.axes.yDomain(0);
        this.handles = this.brushContext.selectAll('.histogram__brush--circular-handles')
            .data([{ type: 'w' }, { type: 'e' }])
            .enter().append('circle')
            .attr('cursor', 'pointer')
            .style('z-index', '30000')
            .attr('r', this.handleRadius)
            .attr('cx', d => 0)
            .attr('cy', d => y0Position)
            .style('stroke', '#000')
            .attr('stroke-width', this.strokeWidth)
            .style('fill', '#fff')
            .on('mouseover', (event, hoveredHandle) => {
                this.setHoveredHandleStyle();
            })
            .on('mouseout', (event, hoveredHandle) => {
                if (!this.isBrushing) {
                    this.setHandleStyle();
                }
            });;
    }

    private setHoveredHandleStyle() {
        const enlargementRatio = 1.7;
        const strokeWidth = 2;
        this.lineContext.selection()
            .attr('stroke-width', strokeWidth);
        this.brushContext
            .selectAll('circle')
            .transition()
            .duration(100)
            .attr('r', this.handleRadius * enlargementRatio)
            .attr('stroke-width', strokeWidth);
    }

    private setHandleStyle() {
        this.lineContext.selection()
            .attr('stroke-width', this.strokeWidth);
        this.brushContext
            .selectAll('circle')
            .transition()
            .duration(100)
            .attr('r', this.handleRadius)
            .attr('stroke-width', this.strokeWidth);
    }
}
