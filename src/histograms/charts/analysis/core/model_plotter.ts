import { ModelResult } from '../models/model_result';
import { ChartAxes, ChartDimensions } from '../../../utils/HistogramUtils';

export abstract class ModelPlotter {
    public modelResult: ModelResult;

    public abstract plot(svgContext, chartAxes: ChartAxes, chartDimensions: ChartDimensions): void;


    public plotHorizontaleLine(id: string, color: string, svgContext, chartAxes: ChartAxes, chartDimensions: ChartDimensions) {
        const avgResult = this.modelResult;
        svgContext.select('#' + id).remove();
        svgContext.append('g').attr('id', id).append('line')
        .attr('x1', 0).attr('y1', chartAxes.yDomain(avgResult.result))
        .attr('x2', chartDimensions.width).attr('y2', chartAxes.yDomain(avgResult.result))
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', color).attr('stroke-width', 1.2);
    }
}
