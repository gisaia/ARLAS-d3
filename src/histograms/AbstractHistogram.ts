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

import {
  ChartDimensions, ChartAxes, SwimlaneAxes, SelectedOutputValues, HistogramUtils,
  DataType, HistogramData, Position, BrushCornerTooltips, SwimlaneData
} from './utils/HistogramUtils';
import { HistogramParams } from './HistogramParams';
import { BrushBehavior } from 'd3-brush';
import { scaleUtc, scaleLinear, scaleTime } from 'd3-scale';
import { min, max } from 'd3-array';

export abstract class AbstractHistogram {

  public histogramParams: HistogramParams;
  public brushCornerTooltips: BrushCornerTooltips;

  public isBrushing = false;

  /** Contexts */
  protected context: any;
  protected barsContext: any;
  protected noDatabarsContext: any;
  protected brushContext: any;
  protected tooltipCursorContext: any;
  protected allAxesContext: any;

  /** Chart dimensions */
  protected chartDimensions: ChartDimensions;
  protected isWidthFixed = false;
  protected isHeightFixed = false;

  /** Data */
  protected dataDomain: Array<HistogramData>;
  protected dataInterval: number;

  /** Brush selection */
  protected selectionBrush: BrushBehavior<any>;
  protected selectionInterval: SelectedOutputValues = { startvalue: null, endvalue: null };
  protected brushHandlesHeight: number = null;
  protected brushHandles;
  protected isBrushed = false;

  protected hasSelectionExceededData = null;
  protected selectedBars = new Set<number>();
  protected fromSetInterval = false;

  /**Axes && ticks */
  protected xTicksAxis;
  protected xLabelsAxis;
  protected xAxis;


  protected hoveredBucketKey: Date | number;

  protected yDimension = 1;
  protected plottingCount = 0;
  protected minusSign = 1;

  public constructor() {
    this.brushCornerTooltips = this.createEmptyBrushCornerTooltips();
  }

  public plot(data: Array<HistogramData> | SwimlaneData) { }

  public init() {
    /** each time we [re]plot, the bucket range is reset */
    this.histogramParams.bucketRange = undefined;
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

  protected getXDomainScale(): any {
    return (this.histogramParams.dataType === DataType.time) ?
      (this.histogramParams.useUtc) ?
        scaleUtc() : scaleTime() : scaleLinear();
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
    selectedEndValue: Date | number): Array<Date | number | { valueOf(): number }> {
    this.setDataInterval(data);
    const xDomainExtent = new Array<Date | number | { valueOf(): number }>();
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
    let horizontalOffset = this.chartDimensions.height;
    if (!!(chartAxes as any).yDomain) {
      if (!this.histogramParams.yAxisFromZero) {
        const minMax = (chartAxes as ChartAxes).yDomain.domain();
        if (minMax[0] >= 0) {
          horizontalOffset = (chartAxes as ChartAxes).yDomain(minMax[0]);
        } else {
          horizontalOffset = (chartAxes as ChartAxes).yDomain(minMax[1]);
        }
      } else {
        horizontalOffset = (chartAxes as ChartAxes).yDomain(0);

      }
    }
    this.xAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__only-axis')
      .attr('transform', 'translate(' + (leftOffset - 1) + ',' + horizontalOffset + ')')
      .call(chartAxes.xAxis);
    this.xTicksAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__ticks-axis')
      .attr('transform', 'translate(' + (leftOffset - 1) + ',' + this.chartDimensions.height * this.histogramParams.xAxisPosition + ')')
      .call(chartAxes.xTicksAxis);
    this.xLabelsAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__labels-axis')
      .attr('transform', 'translate(' + (leftOffset - 1) + ',' + this.chartDimensions.height * this.histogramParams.xAxisPosition + ')')
      .call(chartAxes.xLabelsAxis);
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

  protected plotBars(data: Array<HistogramData>, axes: ChartAxes | SwimlaneAxes, xDataDomain: any, barWeight?: number): void {
    const barWidth = barWeight ? axes.stepWidth * barWeight : axes.stepWidth * this.histogramParams.barWeight;
    this.barsContext = this.context.append('g').attr('class', 'histogram__bars').selectAll('.bar')
      .data(data.filter(d => this.isValueValid(d)))
      .enter().append('rect')
      .attr('x', function (d) { return xDataDomain(d.key); })
      .attr('width', barWidth);

    this.noDatabarsContext = this.context.append('g').attr('class', 'histogram__bars').selectAll('.bar')
      .data(data.filter(d => !this.isValueValid(d)))
      .enter().append('rect')
      .attr('x', function (d) { return xDataDomain(d.key); })
      .attr('width', axes.stepWidth);
  }

  protected isValueValid(bucket: HistogramData): boolean {
    return HistogramUtils.isValueValid(bucket);
  }

  /**
   * This method is called whenever the brush is being moved. It sets the positions the brush's left and right corner tooltips.
   */
  protected setBrushCornerTooltipsPositions() {

    this.brushCornerTooltips.leftCornerTooltip.content = this.histogramParams.startValue;
    this.brushCornerTooltips.rightCornerTooltip.content = this.histogramParams.endValue;

    const leftPosition = this.getAxes().xDomain(this.selectionInterval.startvalue);
    const rightPosition = this.getAxes().xDomain(this.selectionInterval.endvalue);

    // If the html container of each corner tooltip is set, then we proceed to set their positions
    if (this.brushCornerTooltips && this.brushCornerTooltips.leftCornerTooltip.htmlContainer &&
      this.brushCornerTooltips.rightCornerTooltip.htmlContainer) {
      const leftTooltipWidth = this.brushCornerTooltips.leftCornerTooltip.htmlContainer.offsetWidth;
      const rightTooltipWidth = this.brushCornerTooltips.rightCornerTooltip.htmlContainer.offsetWidth;
      if (rightTooltipWidth !== 0 && leftTooltipWidth !== 0) {
        if (leftPosition + leftTooltipWidth + 5 > rightPosition - rightTooltipWidth) {
          // If left tooltip and right tooltip meet, switch from horizontal to vertical positions
          this.brushCornerTooltips.horizontalCssVisibility = 'hidden';
          this.brushCornerTooltips.verticalCssVisibility = 'visible';
          this.setVerticalTooltipsWidth();
          this.setBrushVerticalTooltipsXPositions(leftPosition, rightPosition);
          this.setBrushVerticalTooltipsYPositions();
        } else {
          this.brushCornerTooltips.horizontalCssVisibility = 'visible';
          this.brushCornerTooltips.verticalCssVisibility = 'hidden';
          this.setBrushHorizontalTooltipsXPositions(leftPosition, rightPosition);
          this.setBrushHorizontalTooltipsYPositions();
        }
      }
    } else {
      this.brushCornerTooltips.verticalCssVisibility = 'hidden';
      this.brushCornerTooltips.horizontalCssVisibility = 'hidden';
    }
  }

  protected setVerticalTooltipsWidth() {
    this.brushCornerTooltips.leftCornerTooltip.width = this.brushCornerTooltips.rightCornerTooltip.width = this.chartDimensions.height;
  }

  protected setBrushVerticalTooltipsXPositions(leftPosition: number, rightPosition: number) {
    this.brushCornerTooltips.leftCornerTooltip.xPosition = -this.chartDimensions.height + this.histogramParams.margin.left + leftPosition;
    this.brushCornerTooltips.rightCornerTooltip.xPosition = this.histogramParams.margin.left + rightPosition;
  }

  protected setBrushVerticalTooltipsYPositions() {
    if (this.histogramParams.xAxisPosition === Position.bottom) {
      this.brushCornerTooltips.leftCornerTooltip.yPosition = this.chartDimensions.height + this.histogramParams.margin.bottom;
    } else {
      this.brushCornerTooltips.leftCornerTooltip.yPosition = this.chartDimensions.height + this.histogramParams.margin.top;
    }
    this.brushCornerTooltips.rightCornerTooltip.yPosition = this.brushCornerTooltips.leftCornerTooltip.yPosition;
  }

  protected setBrushHorizontalTooltipsXPositions(leftPosition: number, rightPosition: number) {
    this.brushCornerTooltips.leftCornerTooltip.xPosition = leftPosition + this.histogramParams.margin.left;
    this.brushCornerTooltips.rightCornerTooltip.xPosition = this.histogramParams.margin.right + this.chartDimensions.width - rightPosition;
  }

  protected setBrushHorizontalTooltipsYPositions() {
    if (this.histogramParams.xAxisPosition === Position.bottom) {
      this.brushCornerTooltips.leftCornerTooltip.yPosition = this.chartDimensions.height + 10;
    } else {
      this.brushCornerTooltips.leftCornerTooltip.yPosition = -3;
    }
    this.brushCornerTooltips.rightCornerTooltip.yPosition = this.brushCornerTooltips.leftCornerTooltip.yPosition;
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
