import { ModelPlotter } from '../model_plotter';
import { ChartAxes, ChartDimensions } from '../../../../utils/HistogramUtils';

export class AvgPlotter extends ModelPlotter {
    public plot(svgContext, chartAxes: ChartAxes, chartDimensions: ChartDimensions): void {
        this.plotHorizontaleLine('avg_model', '#ff0000', svgContext, chartAxes, chartDimensions);
    }
}
