import { HistogramParams, SelectionType } from '../histograms/HistogramParams';
import { ChartType, DataType } from '../histograms/utils/HistogramUtils';

export const DEFAULT_HISTOGRAM_WIDTH = 800;
export const DEFAULT_HISTOGRAM_HEIGHT = 400;

export interface ChartOptions {
  dataType?: DataType;
  selectionType?: SelectionType;
  ticksDateFormat?: string;
}

export function createHistogramParams(chartType: ChartType, options: ChartOptions = {}) {
  const container = document.createElement('div');
  const svg = document.createElement('svg');
  container.appendChild(svg);
  const params = new HistogramParams('test');
  params.svgNode = svg as any as SVGElement;
  params.dataType = options.dataType ?? DataType.numeric;
  params.chartType = chartType;

  // Define the size of the container
  Object.defineProperty(container, 'offsetWidth', { value: DEFAULT_HISTOGRAM_WIDTH, configurable: true });
  Object.defineProperty(container, 'offsetHeight', { value: DEFAULT_HISTOGRAM_HEIGHT, configurable: true });
  params.chartWidth = DEFAULT_HISTOGRAM_WIDTH;
  params.chartHeight = DEFAULT_HISTOGRAM_HEIGHT;

  if (options.selectionType) {
    params.selectionType = options.selectionType;
  }

  if (options.ticksDateFormat) {
    params.ticksDateFormat = options.ticksDateFormat;
  }

  params.hasDataChanged = true;

  return { container, params, svg };
}
