import { HistogramData } from 'histograms/utils/HistogramUtils';
import { Brush } from './brush';
import { BrushBehavior, BrushSelection, brushX } from 'd3-brush';

export class RectangleBrush extends Brush {

    public handleHeight: number;
    public handleWidth = 2.5;

    public setHandleHeight(handleHeightWeight): RectangleBrush {
        if (handleHeightWeight <= 1 && handleHeightWeight > 0) {
            this.handleHeight = this.dimensions.height * handleHeightWeight;
        } else {
            this.handleHeight = this.dimensions.height;
        }
        return this;
    }

    public getExtent(): BrushBehavior<HistogramData> {
        if (!this.extent) {
            this.extent = brushX<HistogramData>().extent([
                [this.axes.stepWidth / 5, 0],
                [this.dimensions.width, this.dimensions.height]
            ]);
        }
        return this.extent;
    }

    public size() {
        return this.handleWidth + 2;
    }

    public translateBrushHandles(selection: BrushSelection) {
        const xTranslation = this.handleHeight - (this.dimensions.height - this.handleHeight) / 2;
        if (selection !== null) {
            this.handles.attr('display', null).attr('transform', (d, i) =>
                'translate(' + [selection[i], -xTranslation] + ')');
        } else {
            this.handles.attr('display', 'none');
        }
    }

    public onBrushEnd() {}

    public onBrushStart() {}

    public onBrushing() {}

    public getCssName(): string {
        return 'brush';
    }

    public getFillOpacity(): number {
        return 0.3;
    }

    protected drawHandles(): void {
        const brushResizePath = (d) => (d.type === 'e') ? 0 : -this.handleWidth;
        this.handles = this.brushContext.selectAll('.histogram__brush--handles')
            .data([{ type: 'w' }, { type: 'e' }])
            .enter().append('rect')
            .attr('stroke', '#5e5e5e')
            .attr('fill', '#5e5e5e')
            .attr('cursor', 'ew-resize')
            .style('z-index', '30000')
            .attr('width', this.handleWidth)
            .attr('height', this.handleHeight)
            .attr('x', brushResizePath)
            .attr('y', this.handleHeight);
    }
}
