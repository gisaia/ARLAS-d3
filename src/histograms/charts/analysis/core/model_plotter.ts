import { ModelResult } from '../models/model_result';
import { ChartAxes, ChartDimensions } from '../../../utils/HistogramUtils';

export abstract class ModelPlotter {
    public modelResult: ModelResult;

    public abstract plot(svgContext, chartAxes: ChartAxes, chartDimensions: ChartDimensions): void;
}
