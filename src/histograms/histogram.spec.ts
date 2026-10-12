import { describe, expect, it, vi } from 'vitest';
import { ChartOptions, createHistogramParams, DEFAULT_HISTOGRAM_HEIGHT, DEFAULT_HISTOGRAM_WIDTH } from '../test/histogram.utils';
import { SelectionType } from './HistogramParams';
import { AbstractChart } from './charts/AbstractChart';
import { ChartArea } from './charts/ChartArea';
import { ChartBars } from './charts/ChartBars';
import { ChartCurve } from './charts/ChartCurve';
import { ChartType, DataType, HistogramData } from './utils/HistogramUtils';

const DATA: HistogramData[] = [
  { key: 0, value: 1000 },
  { key: 1, value: 200 },
  { key: 2, value: 15 },
  { key: 3, value: 3000 },
  { key: 4, value: 250 },
];

const DUAL_DATA: HistogramData[] = [
  { key: 0, value: 10, chartId: 'A' },
  { key: 1, value: 20, chartId: 'A' },
  { key: 2, value: 15, chartId: 'A' },
  { key: 0, value: 100, chartId: 'B' },
  { key: 1, value: 200, chartId: 'B' },
  { key: 2, value: 150, chartId: 'B' },
];

function createHistogram(data: HistogramData[], chartType: ChartType, options: ChartOptions = {}) {
  const { container, params, svg } = createHistogramParams(chartType, options);
  params.histogramData = data;

  let chart: AbstractChart;
  switch (chartType) {
    case ChartType.area:
      chart = new ChartArea(params);
      break;
    case ChartType.bars:
      chart = new ChartBars(params);
      break;
    case ChartType.curve:
      chart = new ChartCurve(params);
      break;
  }

  chart.plot(data);
  return { container, svg, params, chart };
}

describe('Histogram', () => {
  describe('Plot buckets of data along an x axis', () => {
    it('renders an SVG element in the container', () => {
      const { container } = createHistogram(DATA, ChartType.bars);
      expect(container.querySelector('svg')).not.toBeNull();
    });

    it('renders one rect per data point', () => {
      const { svg } = createHistogram(DATA, ChartType.bars);
      const dataBars = svg.querySelector('.context .histogram__bars') as Element;
      expect(dataBars).toBeDefined();
      const bars = dataBars.querySelectorAll('rect');
      expect(bars).toHaveLength(DATA.length);
    });

    it('positions buckets in increasing x order', () => {
      const { svg } = createHistogram(DATA, ChartType.bars);
      const dataBars = svg.querySelector('.context .histogram__bars') as Element;
      expect(dataBars).toBeDefined();
      const bars = dataBars.querySelectorAll('rect');
      const xPositions = Array.from(bars).map(b => +(b.getAttribute('x') as string));
      for (let i = 1; i < xPositions.length; i++) {
        expect(xPositions[i]).toBeGreaterThan(xPositions[i - 1]);
      }
    });
  });

  describe('Multiple datasets can be plotted along the x axis with different y axis', () => {
    it('renders two datasets on separate y axes', () => {
      const { svg, chart } = createHistogram(DUAL_DATA, ChartType.curve);
      const curves = svg.querySelectorAll('.histogram__chart--unselected--curve');
      expect(curves.length).toBeGreaterThanOrEqual(2);
      expect(svg.querySelector('.histogram__labels-axis-right')).not.toBeNull();
      // Each dataset gets its own y domain
      const axes = (chart as any).chartAxes;
      expect(+axes.yDomain.domain()[0]).toBeGreaterThanOrEqual(0);
      expect(+axes.yDomain.domain()[1]).toBeGreaterThan(0);
    });

    it('normalizes three or more datasets to [0, 1]', () => {
      const data: HistogramData[] = [
        { key: 0, value: 10, chartId: 'A' },
        { key: 1, value: 20, chartId: 'A' },
        { key: 0, value: 100, chartId: 'B' },
        { key: 1, value: 200, chartId: 'B' },
        { key: 0, value: 5, chartId: 'C' },
        { key: 1, value: 15, chartId: 'C' },
      ];

      const { chart } = createHistogram(data, ChartType.curve);
      const axes = (chart as any).chartAxes;
      expect(axes.yDomain.domain()).toEqual([0, 1]);
    });
  });

  describe('Data plotted can be in curve, bars or area', () => {
    it('renders bars as SVG rect elements', () => {
      const { svg } = createHistogram(DATA, ChartType.bars);
      const dataBars = svg.querySelector('.context .histogram__bars') as Element;
      expect(dataBars).toBeDefined();
      const bars = dataBars.querySelectorAll('rect');
      expect(bars).toHaveLength(DATA.length);
    });

    it('renders a filled area as SVG paths', () => {
      const { svg } = createHistogram(DATA, ChartType.area);
      const paths = svg.querySelectorAll('.histogram__chart--unselected--area');
      expect(paths.length).toBeGreaterThanOrEqual(1);
      expect(paths[0].getAttribute('d')).toBeTruthy();
    });

    it('renders a curve as SVG paths with no fill', () => {
      const { svg } = createHistogram(DATA, ChartType.curve);
      const paths = svg.querySelectorAll('.histogram__chart--unselected--curve');
      expect(paths.length).toBeGreaterThanOrEqual(1);
      expect(paths[0].getAttribute('d')).toBeTruthy();
    });
  });

  describe('When hovering a bucket, an event is emitted', () => {
    it('emits hoveredBucketEvent and tooltipEvent on mousemove over a bucket', () => {
      const { chart, svg } = createHistogram(DATA, ChartType.area);
      const hoverSpy = vi.spyOn(chart.histogramParams.hoveredBucketEvent, 'next');
      const tooltipSpy = vi.spyOn(chart.histogramParams.tooltipEvent, 'next');

      const context = svg.querySelector('.context') as Element;
      const axes = (chart as any).chartAxes;
      const pixelX = axes.xDomain(2);

      expect(context).toBeDefined();
      context.dispatchEvent(new MouseEvent('mousemove', { clientX: pixelX, clientY: 200 }));

      expect(hoverSpy).toHaveBeenCalledWith({ start: 2, end: 3 });
      expect(tooltipSpy).toHaveBeenCalledTimes(1);
      expect(tooltipSpy.mock.calls[0][0].shown).toBe(true);
    });

    it('emits undefined on mouseout after hovering a bucket', () => {
      const { chart, svg } = createHistogram(DATA, ChartType.area);
      const hoverSpy = vi.spyOn(chart.histogramParams.hoveredBucketEvent, 'next');

      const context = svg.querySelector('.context') as Element;
      const axes = (chart as any).chartAxes;

      expect(context).toBeDefined();
      context.dispatchEvent(new MouseEvent('mousemove', { clientX: axes.xDomain(2), clientY: 200 }));
      hoverSpy.mockClear();

      context.dispatchEvent(new MouseEvent('mouseout'));

      expect(hoverSpy).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Histogram has two handles', () => {
    it('renders two rectangular handles when selectionType is rectangle', () => {
      const { svg } = createHistogram(DATA, ChartType.area, { selectionType: SelectionType.rectangle });
      const brushGroup = svg.querySelector('g.brush') as Element;
      expect(brushGroup).toBeDefined();
      const handles = brushGroup.querySelectorAll('rect.histogram__brush--handles--rect');
      expect(handles).toHaveLength(2);
    });

    it('renders two circular handles when selectionType is slider', () => {
      const { svg } = createHistogram(DATA, ChartType.area, { selectionType: SelectionType.slider });
      const sliderGroup = svg.querySelector('g.slider-brush') as Element;
      expect(sliderGroup).toBeDefined();
      const handles = sliderGroup.querySelectorAll('circle.histogram__brush--handles--circle');
      expect(handles).toHaveLength(2);
    });
  });

  describe('Selection dims unselected buckets', () => {
    it('dims unselected bars after changing the selection interval', () => {
      const { chart, svg } = createHistogram(DATA, ChartType.bars);
      chart.setSelectedInterval({ startvalue: 1, endvalue: 3 });

      const dataBars = svg.querySelector('.context .histogram__bars') as Element;
      expect(dataBars).toBeDefined();
      expect(dataBars.querySelectorAll('rect.histogram__chart--bar__currentselection')).toHaveLength(2);
      expect(dataBars.querySelectorAll('rect.histogram__chart--bar')).toHaveLength(2);
      expect(dataBars.querySelectorAll('rect.histogram__chart--bar__partlyselected')).toHaveLength(1);
    });
  });

  describe('Selection can exceed the data range', () => {
    it('extends the x-axis domain when selection exceeds data range', () => {
      const { chart } = createHistogram(DATA, ChartType.bars);

      chart.setSelectedInterval({ startvalue: -2, endvalue: 7 });

      const axes = (chart as any).chartAxes;
      const domain = axes.xDomain.domain();
      expect(+domain[0]).toBeLessThanOrEqual(-2);
      expect(+domain[1]).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Once a selection is made, an event is emitted', () => {
    // Selection is done programatically as drag with jsdom can be flaky
    it('emits valuesListChangedEvent when a selection is made', () => {
      const { chart, params } = createHistogram(DATA, ChartType.bars);
      const nextSpy = vi.spyOn(params.valuesListChangedEvent, 'next');

      const axes = (chart as any).chartAxes;
      (chart as any).brush.move([axes.xDomain(1), axes.xDomain(3)]);

      expect(nextSpy).toHaveBeenCalledTimes(1);
      const emitted = nextSpy.mock.calls[0][0];
      expect(emitted).toBeInstanceOf(Array);
      expect(+emitted[emitted.length - 1].startvalue).toBeCloseTo(1);
      expect(+emitted[emitted.length - 1].endvalue).toBeCloseTo(3);
    });
  });

  describe('Two formats for the x axis exist: time and numeric', () => {
    it('formats numeric x-axis tick labels with a thousands separator', () => {
      const data: HistogramData[] = [
        { key: 1000, value: 10 },
        { key: 2000, value: 20 },
        { key: 3000, value: 30 },
      ];

      const { svg } = createHistogram(data, ChartType.bars);

      const labels = Array.from(svg.querySelector('.histogram__labels-axis')?.querySelectorAll('text') ?? [])
        .map(t => t.textContent);
      expect(labels.length > 0 && labels.some(l => /\d/.test(l) && l.includes(' '))).toBe(true);
    });

    it('formats time x-axis tick labels as dates', () => {
      const data: HistogramData[] = [
        { key: new Date('2024-01-01'), value: 10 },
        { key: new Date('2024-02-01'), value: 20 },
        { key: new Date('2024-03-01'), value: 30 },
      ];

      const { svg } = createHistogram(data, ChartType.bars, { dataType: DataType.time, ticksDateFormat: '%B' });

      const labels = Array.from(svg.querySelector('.histogram__labels-axis')?.querySelectorAll('text') ?? [])
        .map(t => t.textContent);
      // Check that labels contain month written in the format March, October, ...
      expect(labels.filter(l => /^[A-Z][a-z]+$/.test(l)).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Resizing the container of the histogram should resize the histogram', () => {
    it('replots the histogram with updated dimensions after resize', () => {
      const data: HistogramData[] = [
        { key: 0, value: 10 },
        { key: 1, value: 20 },
      ];
      const { container, params, chart } = createHistogram(data, ChartType.bars);

      expect(params.chartWidth).toBe(DEFAULT_HISTOGRAM_WIDTH);
      expect(params.chartHeight).toBe(DEFAULT_HISTOGRAM_HEIGHT);

      // Change chart properties to allow for it to be resized
      (chart as any).isHeightFixed = false;
      (chart as any).isWidthFixed = false;

      // Change container size
      Object.defineProperty(container, 'offsetWidth', { value: 1000, configurable: true });
      Object.defineProperty(container, 'offsetHeight', { value: 500, configurable: true });

      // Trigger resize
      const plotSpy = vi.spyOn(chart, 'plot');
      chart.resize(container);

      expect(params.chartWidth).toBe(1000);
      expect(params.chartHeight).toBe(500);
      expect(plotSpy).toHaveBeenCalledTimes(1);
    });
  });

});
