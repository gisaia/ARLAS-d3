import { describe, expect, it, vi } from 'vitest';
import { ChartOptions, createHistogramParams } from '../test/histogram.utils';
import { SwimlaneBars } from './swimlanes/SwimlaneBars';
import { SwimlaneCircles } from './swimlanes/SwimlaneCircles';
import { ChartType, SwimlaneData, SwimlaneMode, SwimlaneRepresentation } from './utils/HistogramUtils';

interface SwimlaneOptions extends ChartOptions {
  swimlaneRepresentation?: SwimlaneRepresentation;
}

function createSwimlane(data: SwimlaneData, mode: SwimlaneMode, options: SwimlaneOptions = {}) {
  const { container, params, svg } = createHistogramParams(ChartType.swimlane, options);
  params.swimlaneData = data;
  params.swimlaneMode = mode;

  if (options.swimlaneRepresentation) {
    params.swimlaneRepresentation = options.swimlaneRepresentation;
  }

  const chart = mode === SwimlaneMode.circles ? new SwimlaneCircles(params) : new SwimlaneBars(params);

  chart.plot(data);
  return { container, svg, params, chart };
}

const DATA: SwimlaneData = {
  stats: {
    nbLanes: 3,
    globalStats: { min: 10, max: 100, sum: 270, count: 6 },
    columnStats: new Map([
      [0, { min: 10, max: 50, sum: 90, count: 3 }],
      [1, { min: 30, max: 100, sum: 180, count: 3 }],
    ]),
    minBorder: 0,
    maxBorder: 2,
    bucketLength: 1,
  },
  lanes: new Map([
    ['A', [{ key: 0, value: 50 }, { key: 1, value: 30 }]],
    ['B', [{ key: 0, value: 10 }, { key: 1, value: 100 }]],
    ['C', [{ key: 0, value: 30 }, { key: 1, value: 50 }]],
  ]),
};

const TWO_LANE_DATA: SwimlaneData = {
  stats: {
    nbLanes: 2,
    globalStats: { min: 10, max: 210, sum: 390, count: 4 },
    columnStats: new Map([
      [0, { min: 10, max: 150, sum: 160, count: 2 }],
      [1, { min: 20, max: 210, sum: 230, count: 2 }],
    ]),
    minBorder: 0,
    maxBorder: 2,
    bucketLength: 1,
  },
  lanes: new Map([
    ['A', [{ key: 0, value: 10 }, { key: 1, value: 20 }]],
    ['B', [{ key: 0, value: 150 }, { key: 1, value: 210 }]],
  ]),
};

function getLaneValue(data: SwimlaneData, lane: string, index: number) {
  return data.lanes.get(lane)?.[index].value as number;
}

describe('Swimlane', () => {
  describe('Plot histogram data in lanes by key', () => {
    it('renders a label for each key', () => {
      const { svg } = createSwimlane(DATA, SwimlaneMode.variableHeight);
      const labels = svg.querySelectorAll('.swimlane-labels-container text');
      const texts = Array.from(labels).map(l => l.textContent);
      expect(texts).toEqual(['A', 'B', 'C']);
    });

    it('renders one lane per key with a line separator', () => {
      const { svg } = createSwimlane(DATA, SwimlaneMode.variableHeight);
      const separators = svg.querySelectorAll('.histogram__line-separator');
      expect(separators).toHaveLength(4);
    });

    it('renders bars for all keys sharing the same x-axis buckets', () => {
      const { svg } = createSwimlane(DATA, SwimlaneMode.variableHeight);
      const bars = svg.querySelectorAll('.context .histogram__bars rect');
      expect(bars).toHaveLength(6);
    });
  });

  describe('Render swimlane in different visual modes', () => {
    it('renders full-height bars with a line marking the proportion', () => {
      const { svg } = createSwimlane(TWO_LANE_DATA, SwimlaneMode.fixedHeight);

      const bars = svg.querySelectorAll('.context .histogram__bars rect');
      const heights = Array.from(bars).map(b => +(b.getAttribute('height') as string));
      expect(heights[0]).toBeCloseTo(heights[1], 4);
      expect(heights[1]).toBeCloseTo(heights[2], 4);
      expect(heights[2]).toBeCloseTo(heights[3], 4);

      const ticks = svg.querySelectorAll('.context .histogram__swimlane-height line');
      expect(ticks).toHaveLength(4);
    });

    it('renders bars with height proportional to the value', () => {
      const { svg } = createSwimlane(TWO_LANE_DATA, SwimlaneMode.variableHeight);
      const bars = svg.querySelectorAll('.context .histogram__bars rect');
      const heights = Array.from(bars).map(b => +(b.getAttribute('height') as string));
      // A0 compared to A1
      expect(heights[0] / heights[1]).toBeCloseTo(getLaneValue(TWO_LANE_DATA, 'A', 0) / getLaneValue(TWO_LANE_DATA, 'A', 1));
      // B0 compared to B1
      expect(heights[2] / heights[3]).toBeCloseTo(getLaneValue(TWO_LANE_DATA, 'B', 0) / getLaneValue(TWO_LANE_DATA, 'B', 1));
    });

    it('renders circles sized by proportion', () => {
      const { svg } = createSwimlane(TWO_LANE_DATA, SwimlaneMode.circles);
      const rects = svg.querySelectorAll('.context .histogram__bars rect');
      expect(rects).toHaveLength(0);
      const circles = svg.querySelectorAll('.context .histogram__swimlane circle');
      expect(circles).toHaveLength(4);

      const radii = Array.from(circles).map(c => +(c.getAttribute('r') as string));
      // A0 compared to A1
      expect(radii[0] / radii[1]).toBeCloseTo(Math.sqrt(getLaneValue(TWO_LANE_DATA, 'A', 0) / getLaneValue(TWO_LANE_DATA, 'A', 1)));
    });
  });

  describe('Select lanes by clicking', () => {
    function clickLabel(svg: HTMLElement, name: string) {
      const labels = svg.querySelectorAll('.swimlane-labels-container text');
      const target = Array.from(labels).find(l => l.textContent === name) as Element;
      expect(target).toBeDefined();
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    it('selects a single lane by clicking its key', () => {
      const { svg, params } = createSwimlane(DATA, SwimlaneMode.variableHeight);
      clickLabel(svg, 'A');
      expect(params.selectedSwimlanes.has('A')).toBe(true);
      expect(params.selectedSwimlanes.has('B')).toBe(false);
      expect(params.selectedSwimlanes.has('C')).toBe(false);
    });

    it('toggles a lane off when clicking it again', () => {
      const { svg, params } = createSwimlane(DATA, SwimlaneMode.variableHeight);
      clickLabel(svg, 'A');
      clickLabel(svg, 'A');
      expect(params.selectedSwimlanes.has('A')).toBe(false);
    });

    it('selects multiple lanes by clicking keys', () => {
      const { svg, params } = createSwimlane(DATA, SwimlaneMode.variableHeight);
      clickLabel(svg, 'A');
      clickLabel(svg, 'B');
      expect(params.selectedSwimlanes.has('A')).toBe(true);
      expect(params.selectedSwimlanes.has('B')).toBe(true);
      expect(params.selectedSwimlanes.has('C')).toBe(false);
    });

    it('emits selectedSwimlanesEvent when a lane is clicked', () => {
      const { svg, params } = createSwimlane(DATA, SwimlaneMode.variableHeight);
      const nextSpy = vi.spyOn(params.selectedSwimlanesEvent, 'next');
      clickLabel(svg, 'A');
      expect(nextSpy).toHaveBeenCalledTimes(1);
      const emitted = nextSpy.mock.calls[0][0];
      expect(emitted.has('A')).toBe(true);
      expect(emitted.has('B')).toBe(false);
    });
  });

  describe('Hover over a bucket shows tooltip', () => {
    it('emits a tooltip with data for each lane when hovering a bucket', () => {
      const { svg, params, chart } = createSwimlane(DATA, SwimlaneMode.variableHeight);
      const tooltipSpy = vi.spyOn(params.tooltipEvent, 'next');

      const context = svg.querySelector('.context') as Element;
      const axes = (chart as any).swimlaneAxes;
      const startPosition = params.swimLaneLabelsWidth + axes.xDomain(0);
      const midPosition = startPosition + axes.stepWidth * params.barWeight / 2;

      expect(context).toBeDefined();
      context.dispatchEvent(new MouseEvent('mousemove', { clientX: midPosition, clientY: 100 }));

      expect(tooltipSpy).toHaveBeenCalledTimes(1);
      const emitted = tooltipSpy.mock.calls[0][0];
      expect(emitted.shown).toBe(true);
      expect(emitted.y).toHaveLength(3);
      const laneNames = emitted.y?.map(y => y.chartId);
      expect(laneNames).toContain('A');
      expect(laneNames).toContain('B');
      expect(laneNames).toContain('C');
    });

    it('hides the tooltip on mouseout', () => {
      const { svg, params } = createSwimlane(TWO_LANE_DATA, SwimlaneMode.variableHeight);
      const tooltipSpy = vi.spyOn(params.tooltipEvent, 'next');

      const context = svg.querySelector('.context') as Element;
      expect(context).toBeDefined();
      context.dispatchEvent(new MouseEvent('mouseout'));

      expect(tooltipSpy).toHaveBeenCalledTimes(0);
      expect(params.tooltip.isShown).toBe(false);
    });
  });

  describe('Normalize data by line or globally', () => {
    it('normalizes by line using column representation', () => {
      const { svg } = createSwimlane(TWO_LANE_DATA, SwimlaneMode.variableHeight, { swimlaneRepresentation: SwimlaneRepresentation.column });
      const bars = svg.querySelectorAll('.context .histogram__bars rect');
      const heights = Array.from(bars).map(b => +(b.getAttribute('height') as string));

      // B0 compared to A0
      expect(heights[2] / heights[0]).toBeCloseTo(getLaneValue(TWO_LANE_DATA, 'B', 0) / getLaneValue(TWO_LANE_DATA, 'A', 0));
      // B1 compared to A1
      expect(heights[3] / heights[1]).toBeCloseTo(getLaneValue(TWO_LANE_DATA, 'B', 1) / getLaneValue(TWO_LANE_DATA, 'A', 1));
    });

    it('normalizes globally', () => {
      const { svg } = createSwimlane(TWO_LANE_DATA, SwimlaneMode.variableHeight, { swimlaneRepresentation: SwimlaneRepresentation.global });
      const bars = svg.querySelectorAll('.context .histogram__bars rect');
      const heights = Array.from(bars).map(b => +(b.getAttribute('height') as string));

      // globalMax is B1
      // B1 compared to A0
      expect(heights[3] / heights[0]).toBeCloseTo(getLaneValue(TWO_LANE_DATA, 'B', 1) / getLaneValue(TWO_LANE_DATA, 'A', 0));

      // B1 compared to B0
      expect(heights[3] / heights[2]).toBeCloseTo(getLaneValue(TWO_LANE_DATA, 'B', 1) / getLaneValue(TWO_LANE_DATA, 'B', 0));
    });
  });
});
