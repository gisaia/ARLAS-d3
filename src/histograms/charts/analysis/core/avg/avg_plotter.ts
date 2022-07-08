import { ModelPlotter } from '../model_plotter';
import { AvgResult } from '../../models/avg/avg_model_result';
import { ChartAxes, ChartDimensions } from '../../../../utils/HistogramUtils';

export class AvgPlotter extends ModelPlotter {
    public plot(svgContext, chartAxes: ChartAxes, chartDimensions: ChartDimensions): void {
        const avgResult = (this.modelResult as AvgResult);
        svgContext.select('#avg_model').remove();
        svgContext.append('g').attr('id', 'avg_model').append('line')
        .attr('x1', 0).attr('y1', chartAxes.yDomain(avgResult.result))
        .attr('x2', chartDimensions.width).attr('y2', chartAxes.yDomain(avgResult.result))
        .attr('cx', 2).attr('cy', 2)
        .attr('stroke', '#ff0000').attr('stroke-width', 2);
    }
}
