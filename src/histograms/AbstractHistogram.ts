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

import { max, min } from 'd3-array';
import { scaleLinear, ScaleLinear, scaleTime, ScaleTime, scaleUtc } from 'd3-scale';
import { BucketsVirtualContext } from './buckets/buckets';
import { HistogramParams } from './HistogramParams';
import {
  BrushCornerTooltips,
  ChartAxes,
  ChartDimensions,
  DataType, HistogramData,
  HistogramSVGG,
  HistogramUtils,
  isChartAxes,
  Position,
  SelectedOutputValues,
  SwimlaneAxes,
  SwimlaneData
} from './utils/HistogramUtils';

export abstract class AbstractHistogram {

  public histogramParams: HistogramParams;
  public brushCornerTooltips: BrushCornerTooltips;

  /** Contexts */
  protected context: HistogramSVGG;
  protected barsContext: HistogramSVGG;
  protected bucketsContext: BucketsVirtualContext;
  protected noDatabarsContext: HistogramSVGG;
  protected tooltipCursorContext: HistogramSVGG;
  protected allAxesContext: HistogramSVGG;

  /** Chart dimensions */
  protected chartDimensions: ChartDimensions;
  protected isWidthFixed = false;
  protected isHeightFixed = false;

  /** Data */
  protected dataDomain: Array<HistogramData>;
  protected dataInterval: number;

  /** Brush selection */
  protected selectionInterval: SelectedOutputValues = { startvalue: null, endvalue: null };

  protected hasSelectionExceededData = null;
  protected selectedBars = new Set<number>();
  protected fromSetInterval = false;

  /** Axes && ticks */
  protected xTicksAxis;
  protected xLabelsAxis;
  protected xAxis;

  protected yDimension = 1;
  protected plottingCount = 0;
  protected minusSign = 1;

  protected _xlabelMeanWidth = 0;
  protected _previousXLabelTicks = null;
  protected _previousSize = null;
  protected _isWidthIncrease = false;

  public constructor() {
    this.brushCornerTooltips = this.createEmptyBrushCornerTooltips();
  }

  public plot(data: Array<HistogramData> | SwimlaneData) { }

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
  public setHTMLElementsOfBrushCornerTooltips(rightHTMLElement: HTMLElement, leftHTMLElement): void {
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
      this.selectionInterval.startvalue = start;
      this.histogramParams.endValue = HistogramUtils.toString(end, this.histogramParams, dataInterval);
      this.selectionInterval.endvalue = end;
    }
  }

  protected initializeChartDimensions(): void {
    // set chartWidth value equal to container width when it is not specified by the user
    if (this.histogramParams.chartWidth === null) {
      this.histogramParams.chartWidth = this.histogramParams.histogramContainer.offsetWidth;
    } else if (this.histogramParams.chartWidth !== null && this.plottingCount === 0) {
      this.isWidthFixed = true;
    }
  }

  protected initializeChartHeight(): void {
    if (this.histogramParams.chartHeight === null) {
      this.histogramParams.chartHeight = this.histogramParams.histogramContainer.offsetHeight;
    } else if (this.histogramParams.chartHeight !== null && this.plottingCount === 0) {
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

  protected getFollowingLastBucket(data): HistogramData {
    const dataInterval = this.getDataInterval(data);
    const followingLastBucketKey = +data[data.length - 1].key + dataInterval;

    let value = 0;
    const minimum = min(data, (d: HistogramData) => this.isValueValid(d) ? d.value : Number.MAX_VALUE);
    const maximum = max(data, (d: HistogramData) => this.isValueValid(d) ? d.value : Number.MIN_VALUE);
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
      selectedEndValue: Date | number): Array<Date | number | { valueOf(): number; }> {
    this.setDataInterval(data);
    const xDomainExtent = new Array<Date | number | { valueOf(): number; }>();
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
    dataKeyUnionSelectedValues.push(selectedStartValue);
    dataKeyUnionSelectedValues.push(selectedEndValue);
    if (this.histogramParams.dataType === DataType.time) {
      xDomainExtent.push(new Date(min(dataKeyUnionSelectedValues, (d: Date) => +d) - this.dataInterval / 5));
      xDomainExtent.push(new Date(max(dataKeyUnionSelectedValues, (d: Date) => +d)));
    } else {
      xDomainExtent.push(min(dataKeyUnionSelectedValues, (d: number) => d) * 1 - this.dataInterval / 5 * this.yDimension);
      xDomainExtent.push(max(dataKeyUnionSelectedValues, (d: number) => d) * 1);
    }
    return xDomainExtent;
  }

  /**
   *  Removes the indicator behind the hovered bucket of the histogram
   */
  protected clearTooltipCursor(): void { }

  protected drawChartAxes(chartAxes: ChartAxes | SwimlaneAxes, leftOffset: number): void {
    const marginTopBottom = this.chartDimensions.margin.top * this.histogramParams.xAxisPosition +
      this.chartDimensions.margin.bottom * (1 - this.histogramParams.xAxisPosition);
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
      .attr('transform', 'translate(' + (leftOffset - 1) + ',' + this.chartDimensions.height * this.histogramParams.xAxisPosition + ')')
      .call(chartAxes.xTicksAxis);
    this.xLabelsAxis =  this.createXLabelAxis(this.allAxesContext,chartAxes.xLabelsAxis, leftOffset );
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

  public createXLabelAxis(svgNode: HistogramSVGG, xLabelsAxis, leftOffset: number){
    return svgNode.append('g')
        .attr('class', 'histogram__labels-axis')
        .attr('transform', 'translate(' + (leftOffset - 1) + ',' + this.chartDimensions.height * this.histogramParams.xAxisPosition + ')')
        .call(xLabelsAxis);
  }

  public getHorizontalOffset(chartAxes){
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
    if(this._previousXLabelTicks !== null) {
      chartAxes.xLabelsAxis.ticks(this._previousXLabelTicks);
    }
    // create virtual nodes. Helps to get label's width.
    const virtualLabels = this.chartDimensions.svg.append('g');
    const labels = this.createXLabelAxis(virtualLabels,chartAxes.xLabelsAxis, leftOffset ).selectAll('text');
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
        if(this.isOverlapXAxis(currentNodeDimensions,nextNodeDimensions)) {
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
      if(!this._isWidthIncrease) {
        // get the min value between default label size and the max label size allowed.
        selectLabelCount =  min([this.histogramParams.xLabels, labelCount,  this._previousXLabelTicks]);
      } else {
        // check prop value to know when we can restore original state.
        selectLabelCount =  max([labelCount, this._previousXLabelTicks]);
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

  public getDimension(node): DOMRect {
    if (typeof node.getBoundingClientRect === 'function') {
      return node.getBoundingClientRect();
    } else if (node instanceof SVGGraphicsElement) { // check if node is svg element
      return node.getBBox();
    }
  }

  public isOverlapXAxis (l, r) {
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
    this.barsContext = this.context.append('g').attr('class', 'histogram__bars').selectAll('.bar')
      .data(data.filter(d => this.isValueValid(d)))
      .enter().append('rect')
      .attr('x', (d: HistogramData) => axes.xDomain((+d.key)))
      .attr('width', barWidth);

    this.noDatabarsContext = this.context.append('g').attr('class', 'histogram__bars').selectAll('.bar')
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

  protected abstract setDataInterval(data: Array<HistogramData> | Map<string, Array<HistogramData>>): void;
  protected abstract getDataInterval(data: Array<HistogramData> | Map<string, Array<HistogramData>>): number;
  protected abstract getAxes(): ChartAxes | SwimlaneAxes;

  private createEmptyBrushCornerTooltips(): BrushCornerTooltips {
    const emptyLeftCornerTooltip = { htmlContainer: null, content: '', xPosition: 0, yPosition: 0 };
    const emptyRightCornerTooltip = { htmlContainer: null, content: '', xPosition: 0, yPosition: 0 };
    return {
      leftCornerTooltip: emptyLeftCornerTooltip, rightCornerTooltip: emptyRightCornerTooltip,
      verticalCssVisibility: 'hidden', horizontalCssVisibility: 'hidden'
    };
  }
}
