import { ModelPlotter } from '../model_plotter';
import { ChartAxes, ChartDimensions } from '../../../../utils/HistogramUtils';

export class StdDevPlotter extends ModelPlotter {
    public plot(svgContext, chartAxes: ChartAxes, chartDimensions: ChartDimensions): void {
        this.plotHorizontaleLine('stddev_model', '#00ff00', svgContext, chartAxes, chartDimensions);
    }
}
