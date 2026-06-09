/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Axis } from 'd3-axis';
import { NumberValue, scaleLinear, ScaleLinear, scaleTime, ScaleTime, scaleUtc } from 'd3-scale';
import { BaseType, Selection } from 'd3-selection';
import { BucketsVirtualContext } from './buckets/buckets';
import { HistogramParams } from './HistogramParams';
import {
  BrushCornerTooltips,
  BucketInterval,
  ChartAxes,
  ChartDimensions,
  DataType,
  HistogramBarSVG,
  HistogramCircleSVG,
  HistogramData,
  HistogramSVGG,
  HistogramTooltipYValue,
  HistogramUtils,
  isChartAxes,
  Position,
  positionToNumber,
  SelectedOutputValues,
  SwimlaneAxes
} from './utils/HistogramUtils';

export type HistogramAxis = Selection<SVGGElement, HistogramData, null, undefined>;

export type BarContext = HistogramBarSVG | HistogramCircleSVG;

export abstract class AbstractHistogram {

  public histogramParams: HistogramParams;
  public brushCornerTooltips: BrushCornerTooltips;

  /** Contexts */
  protected context?: HistogramSVGG;
  protected barsContext?: HistogramBarSVG | HistogramCircleSVG;
  protected bucketsContext?: BucketsVirtualContext;
  protected noDatabarsContext?: HistogramBarSVG;
  protected tooltipCursorContext?: HistogramSVGG;
  protected allAxesContext?: HistogramSVGG;

  /** Chart dimensions */
  protected chartDimensions!: ChartDimensions;
  protected isWidthFixed = false;
  protected isHeightFixed = false;

  /** Data */
  protected dataDomain: Array<HistogramData> = [];
  protected dataInterval = 0;

  /** Brush selection */
  protected selectionInterval: SelectedOutputValues = { startvalue: Number.NaN, endvalue: Number.NaN };

  protected hasSelectionExceededData = false;
  protected selectedBars = new Set<number>();
  protected fromSetInterval = false;

  /** Axes && ticks */
  protected xTicksAxis?: HistogramAxis;
  protected xLabelsAxis?: HistogramAxis;
  protected xAxis?: HistogramAxis;

  protected yDimension = 1;
  protected plottingCount = 0;
  protected minusSign = 1;

  protected _xlabelMeanWidth = 0;
  protected _previousXLabelTicks?: number;
  protected _previousSize?: number;
  protected _isWidthIncrease = false;

  public constructor(histogramParams: HistogramParams) {
    this.brushCornerTooltips = this.createEmptyBrushCornerTooltips();
    this.histogramParams = histogramParams;
  }

  public init() {
    /** each time we [re]plot, the bucket range is reset */
    this.histogramParams.bucketRange = undefined;
    if(!this._previousSize){
      this._previousSize = this.histogramParams.chartWidth;
    }

    this.setHistogramMargins();
    if (this.context) {
      this.context.remove();
    }
  }

  public abstract resize(histogramContainer: HTMLElement): void;

  /**
   * initialize a new BrushCornerTooltips object
   */
  public setHTMLElementsOfBrushCornerTooltips(rightHTMLElement: HTMLElement, leftHTMLElement: HTMLElement): void {
    if (!this.brushCornerTooltips) {
      this.brushCornerTooltips = this.createEmptyBrushCornerTooltips();
    }
    this.brushCornerTooltips.rightCornerTooltip.htmlContainer = rightHTMLElement;
    this.brushCornerTooltips.leftCornerTooltip.htmlContainer = leftHTMLElement;
  }

  protected setHistogramMargins() {
    // tighten right and bottom margins when X labels are not shown
    if (!this.histogramParams.showXLabels) {
      this.histogramParams.margin.bottom = 5;
      this.histogramParams.margin.right = 7;
    }

    // tighten left margin when Y labels are not shown
    if (!this.histogramParams.showYLabels) {
      if (this.histogramParams.showXLabels) {
        this.histogramParams.margin.left = 10;
      } else {
        this.histogramParams.margin.left = 7;
      }
    }

    if (this.histogramParams.xAxisPosition === Position.top) {
      this.minusSign = -1;
    }
  }

  protected initializeDescriptionValues(start: Date | number, end: Date | number, dataInterval: number) {
    if (!this.fromSetInterval && this.histogramParams.hasDataChanged) {
      this.histogramParams.startValue = HistogramUtils.toString(start, this.histogramParams, dataInterval);
      this.histogramParams.endValue = HistogramUtils.toString(end, this.histogramParams, dataInterval);
      this.selectionInterval = { startvalue: start, endvalue: end};
    }
  }

  protected initializeChartDimensions(): void {
    // set chartWidth value equal to container width when it is not specified by the user
    if (!this.histogramParams.chartWidth && this.histogramParams.histogramContainer) {
      this.histogramParams.chartWidth = this.histogramParams.histogramContainer.offsetWidth;
    } else if (this.plottingCount === 0) {
      this.isWidthFixed = true;
    }
  }

  protected initializeChartHeight(): void {
    if (!this.histogramParams.chartHeight && this.histogramParams.histogramContainer) {
      this.histogramParams.chartHeight = this.histogramParams.histogramContainer.offsetHeight;
    } else if (this.plottingCount === 0) {
      this.isHeightFixed = true;
    }
  }

  /**
   * Create the link between the scale of the chart and the width available
   */
  protected getXDomainScale(rangeStart: number, rangeEnd: number): ScaleTime<number, number> | ScaleLinear<number, number> {
    const scale = ((this.histogramParams.dataType === DataType.time) ?
    (this.histogramParams.useUtc ?
      scaleUtc() : scaleTime()) : scaleLinear()).range([rangeStart, rangeEnd]);
    return (scale instanceof Array ? scaleLinear(scale) : scale);
  }

  protected getHistogramMinMaxBorders(data: Array<HistogramData>): [number | Date, number | Date] {
    const minBorder = data[0].key;
    const followingLastBucket = this.getFollowingLastBucket(data);
    const maxBorder = followingLastBucket.key;
    return [minBorder, maxBorder];
  }

  protected getFollowingLastBucket(data: HistogramData[]): HistogramData {
    const dataInterval = this.getDataInterval(data);
    const followingLastBucketKey = +data[data.length - 1].key + dataInterval;

    let value = 0;
    const minimum = Math.min(...data.map(d => this.isValueValid(d) ? d.value : Number.MAX_VALUE));
    const maximum = Math.max(...data.map(d => this.isValueValid(d) ? d.value : Number.MIN_VALUE));
    if (!this.histogramParams.yAxisFromZero) {
      if (minimum >= 0) {
        value = minimum;
      } else {
        value = maximum;
      }
    }
    const followingLastBucket = { key: followingLastBucketKey, value };
    const parsedFollowingLastBucket = HistogramUtils.parseDataKey([followingLastBucket], this.histogramParams.dataType)[0];
    return parsedFollowingLastBucket;
  }

  protected getXDomainExtent(data: Array<HistogramData>, selectedStartValue: Date | number,
      selectedEndValue: Date | number): NumberValue[] {
    this.setDataInterval(data);
    const xDomainExtent = new Array<NumberValue>();
    const dataKeyUnionSelectedValues = new Array<Date | number>();
    data.forEach(d => {
      dataKeyUnionSelectedValues.push(d.key);
    });
    // Include the end of the last bucket to the extent
    dataKeyUnionSelectedValues.push(this.getHistogramMinMaxBorders(data)[1]);
    if (!this.histogramParams.displayOnlyIntervalsWithData) {
      this.histogramParams.intervalSelectedMap.forEach(values => {
        if (selectedStartValue > values.values.startvalue) {
          selectedStartValue = values.values.startvalue;
        }
        if (selectedEndValue < values.values.endvalue) {
          selectedEndValue = values.values.endvalue;
        }
      });
    }

    if (!Number.isNaN(selectedStartValue)) {
      dataKeyUnionSelectedValues.push(selectedStartValue);
    }
    if (!Number.isNaN(selectedEndValue)) {
      dataKeyUnionSelectedValues.push(selectedEndValue);
    }

    if (this.histogramParams.dataType === DataType.time) {
      xDomainExtent.push(new Date(Math.min(...dataKeyUnionSelectedValues.map(d => +d)) - this.dataInterval / 5));
      xDomainExtent.push(new Date(Math.max(...dataKeyUnionSelectedValues.map(d => +d))));
    } else {
      xDomainExtent.push(Math.min(...dataKeyUnionSelectedValues.map(d => +d)) * 1 - this.dataInterval / 5 * this.yDimension);
      xDomainExtent.push(Math.max(...dataKeyUnionSelectedValues.map(d => +d)) * 1);
    }
    return xDomainExtent;
  }

  /**
   *  Removes the indicator behind the hovered bucket of the histogram
   */
  protected clearTooltipCursor(): void { }

  protected drawChartAxes(chartAxes: ChartAxes | SwimlaneAxes, leftOffset: number): void {
    const xAxisPosition = positionToNumber(this.histogramParams.xAxisPosition);
    const marginTopBottom = this.chartDimensions.margin.top * xAxisPosition +
      this.chartDimensions.margin.bottom * (1 - xAxisPosition);
    this.context = this.chartDimensions.svg.append('g')
      .attr('class', 'context')
      .attr('transform', 'translate(' + this.chartDimensions.margin.left + ',' + marginTopBottom + ')');
    this.tooltipCursorContext = this.context.append('g').attr('class', 'tooltip_histogram_bar');
    this.context.on('mouseleave', () => this.clearTooltipCursor());
    this.allAxesContext = this.context.append('g').attr('class', 'histogram__all-axes');
    // leftOffset is the width of Y labels, so x axes are translated by leftOffset
    // Y axis is translated to the left of 1px so that the chart doesn't hide it
    // Therefore, we substruct 1px (leftOffset - 1) so that the first tick of xAxis will coincide with y axis
    const horizontalOffset = this.getHorizontalOffset(chartAxes);
    this.xAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__only-axis')
      .attr('transform', 'translate(' + (leftOffset - 1) + ',' + horizontalOffset + ')')
      .call(chartAxes.xAxis);
    this.xTicksAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__ticks-axis')
      .attr('transform', 'translate(' + (leftOffset - 1) + ',' + this.chartDimensions.height * xAxisPosition + ')')
      .call(chartAxes.xTicksAxis);
    this.xLabelsAxis =  this.createXLabelAxis(this.allAxesContext, chartAxes.xLabelsAxis, leftOffset );
    this.xTicksAxis.selectAll('path').attr('class', 'histogram__axis');
    this.xAxis.selectAll('path').attr('class', 'histogram__axis');
    this.xTicksAxis.selectAll('line').attr('class', 'histogram__ticks');
    this.xLabelsAxis.selectAll('text').attr('class', 'histogram__labels');
    if (!this.histogramParams.showXTicks) {
      this.xTicksAxis.selectAll('g').attr('class', 'histogram__ticks-axis__hidden');
    }
    if (!this.histogramParams.showXLabels) {
      this.xLabelsAxis.attr('class', 'histogram__labels-axis__hidden');
    }
  }

  public createXLabelAxis(svgNode: HistogramSVGG, xLabelsAxis: Axis<NumberValue>, leftOffset: number) {
    const xAxisPosition = positionToNumber(this.histogramParams.xAxisPosition);
    return svgNode.append('g')
        .attr('class', 'histogram__labels-axis')
        .attr('transform', 'translate(' + (leftOffset - 1) + ',' + this.chartDimensions.height * xAxisPosition + ')')
        .call(xLabelsAxis);
  }

  public getHorizontalOffset(chartAxes: ChartAxes | SwimlaneAxes) {
    let h = this.chartDimensions.height;
    if (isChartAxes(chartAxes)) {
      if (!this.histogramParams.yAxisFromZero) {
        const minMax = chartAxes.yDomain.domain();
        if (minMax[0] >= 0) {
          h = chartAxes.yDomain(minMax[0]);
        } else {
          h = chartAxes.yDomain(minMax[1]);
        }
      } else {
        h = chartAxes.yDomain(0);
      }
    }
    return h;
  }

  public updateNumberOfLabelDisplayedIfOverlap(chartAxes: ChartAxes | SwimlaneAxes, leftOffset = 0){
    // Get the offset used when we will draw the labels.
    const horizontalOffset = this.getHorizontalOffset(chartAxes);
    let sumWidth = 0;

    //  update with current tick state to avoid create a virtual node with all data.
    if (this._previousXLabelTicks) {
      chartAxes.xLabelsAxis.ticks(this._previousXLabelTicks);
    }
    // create virtual nodes. Helps to get label's width.
    const virtualLabels = this.chartDimensions.svg.append('g');
    const labels = this.createXLabelAxis(virtualLabels, chartAxes.xLabelsAxis, leftOffset ).selectAll('text');
    // check for all labels if there is an overlap.
    let hasOverlap = false;
    const nodes = labels.nodes();
    const labelsSize = labels.size();
    // init value when before potential increase charts
    if(!this._previousXLabelTicks) {
      this._previousXLabelTicks = labelsSize;
    }
    for (let i = 0; i < labelsSize; i++) {
      const next = i + 1;
      const currentNodeDimensions = this.getDimension(nodes[i]);
      if(nodes[next]){
        const nextNodeDimensions = this.getDimension(nodes[next]);
        if(this.isOverlapXAxis(currentNodeDimensions, nextNodeDimensions)) {
          hasOverlap = true;
        }
      }

      sumWidth += currentNodeDimensions.width;
    }

    // remove virtual node. If we do not it will be displayed
    virtualLabels.remove();
    if(hasOverlap || this._isWidthIncrease) {
      // calc label mean width once.
      const currentCount = this._previousXLabelTicks ?? this.histogramParams.xLabels;
      this._xlabelMeanWidth  = Math.round(sumWidth / currentCount);

      //  calc number of labels according to the mean width of a label and the width of the chart
      const labelCount = Math.floor(this.histogramParams.chartWidth  /  (this._xlabelMeanWidth + horizontalOffset));
      let selectLabelCount: number;
      if (!this._isWidthIncrease) {
        // get the min value between default label size and the max label size allowed.
        selectLabelCount = Math.min(this.histogramParams.xLabels, labelCount,  this._previousXLabelTicks);
      } else {
        // check prop value to know when we can restore original state.
        selectLabelCount = Math.max(labelCount, this._previousXLabelTicks);
      }
      // value to be used when we create virtual labels
      this._previousXLabelTicks = selectLabelCount;

      // update ticks for label and ticks axis. If we have a lot of label we resize ticks.
      chartAxes.xLabelsAxis.ticks(selectLabelCount);
      if (selectLabelCount > this.histogramParams.xTicks) {
        chartAxes.xTicksAxis.ticks(selectLabelCount * this.histogramParams.xLabelsToTicksFactor);
      } else {
        chartAxes.xTicksAxis.ticks(this.histogramParams.xTicks);
      }
    }
  }

  public getDimension(node: BaseType): DOMRect {
    if (!node) {
      throw new Error('node must not be null');
    }

    if (typeof (node as Element).getBoundingClientRect === 'function') {
      return (node as Element).getBoundingClientRect();
    } else if (node instanceof SVGGraphicsElement) { // check if node is svg element
      return node.getBBox();
    }

    throw new Error('node must have "getBoundingClientRect" method or be an instance of "SVGGraphicsElement"');
  }

  public isOverlapXAxis(l: DOMRect, r: DOMRect) {
    const a  = {left: 0, right: 0};
    const b = {left: 0, right: 0};
    a.left = l.x - this.histogramParams.xLabelOverlapPadding;
    a.right = l.x + l.width + this.histogramParams.xLabelOverlapPadding;
    b.left = r.x - this.histogramParams.xLabelOverlapPadding;
    b.right = r.x + r.width + this.histogramParams.xLabelOverlapPadding;
    return a.right >= b.left || b.left <= a.right;
  }

  protected plotBars(data: Array<HistogramData>, axes: ChartAxes | SwimlaneAxes, barWeight?: number): void {
    const barWidth = barWeight ? axes.stepWidth * barWeight : axes.stepWidth * this.histogramParams.barWeight;

    this.barsContext = this.context?.append('g').attr('class', 'histogram__bars').selectAll('.bar')
      .data(data.filter(d => this.isValueValid(d)))
      .enter().append('rect')
      .attr('x', (d: HistogramData) => axes.xDomain((+d.key)))
      .attr('width', barWidth);

    this.noDatabarsContext = this.context?.append('g').attr('class', 'histogram__bars').selectAll('.bar')
      .data(data.filter(d => !this.isValueValid(d)))
      .enter().append('rect')
      .attr('x', (d: HistogramData) => axes.xDomain((+d.key)))
      .attr('width', axes.stepWidth);
  }

  protected isValueValid(bucket: HistogramData): boolean {
    return HistogramUtils.isValueValid(bucket);
  }

  protected getHistogramDataInterval(data: Array<HistogramData>): number {
    let interval = Number.MAX_VALUE;
    if (data.length > 1) {
      /** We need to get the smallest difference between 2 buckets that is different from 0 */
      for (let i = 0; i < data.length - 1; i++) {
        const diff = +data[i + 1].key - +data[i].key;
        if (diff > 0) {
          interval = Math.min(interval, diff);
        }
      }
      /** this means that all the buckets have the same key (with different chart ids) */
      if (interval === Number.MAX_VALUE) {
        if (this.histogramParams.dataType === DataType.time) {
          /** interval = 1 day */
          interval = 24 /** h */ * 3600 /** s */ * 1000 /** ms */;
        } else {
          /** interval = 1 unit */
          interval = 1;
        }
      }
    } else {
      interval = 0;
    }
    return interval;
  }

  protected getbucketInterval(bucketInterval: number, dataType: DataType): BucketInterval {
    if (dataType === DataType.time) {
      const D_2_MS = 86400000;
      const M_2_MS = 30 * D_2_MS;
      const Y_2_MS = 12 * M_2_MS;
      const H_2_MS = 3600000;
      const timestampToInterval = new Map<number, { value: number; unit: string; }>();
      /** seconds */
      timestampToInterval.set(1000, { value: 1, unit: 'second' });
      timestampToInterval.set(2000, { value: 2, unit: 'seconds' });
      timestampToInterval.set(5000, { value: 5, unit: 'seconds' });
      timestampToInterval.set(10000, { value: 10, unit: 'seconds' });
      timestampToInterval.set(30000, { value: 30, unit: 'seconds' });
      /** minutes */
      timestampToInterval.set(60000, { value: 1, unit: 'minute' });
      timestampToInterval.set(120000, { value: 2, unit: 'minutes' });
      timestampToInterval.set(300000, { value: 5, unit: 'minutes' });
      timestampToInterval.set(600000, { value: 10, unit: 'minutes' });
      timestampToInterval.set(900000, { value: 15, unit: 'minutes' });
      timestampToInterval.set(1800000, { value: 30, unit: 'minutes' });
      /** hours */
      timestampToInterval.set(H_2_MS, { value: 1, unit: 'hour' });
      timestampToInterval.set(2 * H_2_MS, { value: 2, unit: 'hours' });
      timestampToInterval.set(3 * H_2_MS, { value: 3, unit: 'hours' });
      timestampToInterval.set(6 * H_2_MS, { value: 6, unit: 'hours' });
      timestampToInterval.set(12 * H_2_MS, { value: 12, unit: 'hours' });
      /** days */
      timestampToInterval.set(D_2_MS, { value: 1, unit: 'day' });
      timestampToInterval.set(2 * D_2_MS, { value: 2, unit: 'days' });
      timestampToInterval.set(7 * D_2_MS, { value: 1, unit: 'week' });
      timestampToInterval.set(10 * D_2_MS, { value: 10, unit: 'days' });
      timestampToInterval.set(14 * D_2_MS, { value: 2, unit: 'weeks' });
      timestampToInterval.set(15 * D_2_MS, { value: 15, unit: 'days' });
      /** months */
      timestampToInterval.set(M_2_MS, { value: 30, unit: 'days (~ 1 month)' });
      timestampToInterval.set(2 * M_2_MS, { value: 60, unit: 'days (~ 2 months)' });
      timestampToInterval.set(3 * M_2_MS, { value: 90, unit: 'days (~ 3 months)' });
      timestampToInterval.set(4 * M_2_MS, { value: 120, unit: 'days (~ 4 months)' });
      timestampToInterval.set(6 * M_2_MS, { value: 180, unit: 'days (~ 6 months)' });
      /** years 1, 2, 5, 10*/
      timestampToInterval.set(Y_2_MS, { value: 365, unit: 'days (~ 1 year)' });
      timestampToInterval.set(2 * Y_2_MS, { value: 730, unit: 'days (~ 2 years)' });
      timestampToInterval.set(5 * Y_2_MS, { value: 1825, unit: 'days (~ 5 years)' });
      timestampToInterval.set(10 * Y_2_MS, { value: 3650, unit: 'days (~ 10 years)' });
      const allIntervals = Array.from(timestampToInterval.keys()).map(i => +i).sort((a, b) => a - b);
      let value = allIntervals[0];
      for (let i = 0; i < allIntervals.length; i++) {
        if (i < allIntervals.length - 1) {
          const current = allIntervals[i];
          const next = allIntervals[i + 1];
          if (bucketInterval >= current && bucketInterval < next) {
            const leftDistance = Math.abs(bucketInterval - current);
            const rightDistance = Math.abs(bucketInterval - next);
            if (leftDistance < rightDistance) {
              value = current;
            } else {
              value = next;
            }
            break;
          }
        } else {
          value = allIntervals[i];
        }
      }
      return timestampToInterval.get(value) as BucketInterval;
    } else {
      const histogramParams = { ...this.histogramParams};
      histogramParams.numberFormatChar = '';
      return { value: +HistogramUtils.toString(bucketInterval, histogramParams, bucketInterval) };
    }
  }

  protected emitTooltip(display: boolean, xy: [number, number],
    xStartValue: string | undefined, xEndValue: string | undefined, ys: HistogramTooltipYValue[]
  ) {
    if (display) {
      this.histogramParams.tooltipEvent.next(
        {
          xStartValue: xStartValue,
          xEndValue: xEndValue,
          xRange: this.histogramParams.bucketInterval,
          dataType: (this.histogramParams.dataType === DataType.time ? 'time' : 'numeric'),
          y: ys,
          shown: true,
          xPosition: xy[0] + this.chartDimensions.margin.left,
          yPosition: xy[1],
          chartWidth: this.chartDimensions.width + this.chartDimensions.margin.left + this.chartDimensions.margin.right
        }
      );
    } else {
      this.clearTooltipCursor();
      this.histogramParams.tooltipEvent.next(
        {
          y: ys,
          shown: false,
          xPosition: xy[0] + this.chartDimensions.margin.left,
          yPosition: xy[1],
          chartWidth: this.chartDimensions.width + this.chartDimensions.margin.left + this.chartDimensions.margin.right
        }
      );
    }
  }

  protected abstract setDataInterval(data: Array<HistogramData> | Map<string, Array<HistogramData>>): void;
  protected abstract getDataInterval(data: Array<HistogramData> | Map<string, Array<HistogramData>>): number;
  /** Useful to return a different set of axes for histogram vs swimlane */
  protected abstract getAxes(): ChartAxes | SwimlaneAxes | undefined;

  private createEmptyBrushCornerTooltips(): BrushCornerTooltips {
    const emptyLeftCornerTooltip = { htmlContainer: undefined, content: '', xPosition: 0, yPosition: 0 };
    const emptyRightCornerTooltip = { htmlContainer: undefined, content: '', xPosition: 0, yPosition: 0 };
    return {
      leftCornerTooltip: emptyLeftCornerTooltip,
      rightCornerTooltip: emptyRightCornerTooltip,
      verticalCssVisibility: 'hidden',
      horizontalCssVisibility: 'hidden'
    };
  }
}
