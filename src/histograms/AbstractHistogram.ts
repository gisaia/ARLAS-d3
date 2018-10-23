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
  ChartDimensions, ChartAxes, SwimlaneAxes, SelectedInputValues, SelectedOutputValues, HistogramUtils,
  ChartType, DataType, MarginModel, HistogramData, Position
} from './utils/HistogramUtils';
import { HistogramParams } from './HistogramParams';
import { BrushBehavior } from 'd3-brush';
import { scaleUtc, scaleLinear } from 'd3-scale';
import { min, max } from 'd3-array';

export abstract class AbstractHistogram {

  public histogramParams: HistogramParams;
  public isBrushing = false;

  /** Contexts */
  protected context: any;
  protected barsContext: any;
  protected brushContext: any;
  protected allAxesContext: any;

  /** Chart dimensions */
  protected chartDimensions: ChartDimensions;
  protected isWidthFixed = false;
  protected isHeightFixed = false;

  /** Data */
  protected dataDomain: Array<{ key: number, value: number }>;
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
  protected yAxis;
  protected yTicksAxis;
  protected yLabelsAxis;

  protected hoveredBucketKey: Date | number;

  protected yDimension = 1;
  protected plottingCount = 0;
  protected minusSign = 1;

  public plot(data: Array<{ key: number, value: number }> | Map<string, Array<{ key: number, value: number }>>) {
    this.setHistogramMargins();
    if (this.context) {
      this.context.remove();
    }
  }

  public abstract resize(histogramContainer: HTMLElement): void;

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

  protected initializeDescriptionValues(start: Date | number, end: Date | number) {
    if (!this.fromSetInterval && this.histogramParams.hasDataChanged) {
      const dataInterval = this.getDataInterval(this.histogramParams.data);

      this.histogramParams.startValue = HistogramUtils.toString(start, this.histogramParams.chartType,
        this.histogramParams.dataType, this.histogramParams.moveDataByHalfInterval, this.histogramParams.valuesDateFormat, dataInterval);
      this.selectionInterval.startvalue = start;

      this.histogramParams.endValue = HistogramUtils.toString(end, this.histogramParams.chartType,
        this.histogramParams.dataType, this.histogramParams.moveDataByHalfInterval, this.histogramParams.valuesDateFormat, dataInterval);
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
    return (this.histogramParams.dataType === DataType.time) ? scaleUtc() : scaleLinear();
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
    const followingLastBucket = { key: followingLastBucketKey, value: 0 };
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

  protected drawChartAxes(chartAxes: ChartAxes | SwimlaneAxes, leftOffset: number): void {
    const marginTopBottom = this.chartDimensions.margin.top * this.histogramParams.xAxisPosition +
      this.chartDimensions.margin.bottom * (1 - this.histogramParams.xAxisPosition);
    this.context = this.chartDimensions.svg.append('g')
      .attr('class', 'context')
      .attr('transform', 'translate(' + this.chartDimensions.margin.left + ',' + marginTopBottom + ')');
    this.allAxesContext = this.context.append('g').attr('class', 'histogram__all-axes');
    // leftOffset is the width of Y labels, so x axes are translated by leftOffset
    // Y axis is translated to the left of 1px so that the chart doesn't hide it
    // Therefore, we substruct 1px (leftOffset - 1) so that the first tick of xAxis will coincide with y axis
    this.xAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__only-axis')
      .attr('transform', 'translate(' + (leftOffset - 1) + ',' + this.chartDimensions.height + ')')
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
      .data(data)
      .enter().append('rect')
      .attr('class', 'histogram__chart--bar')
      .attr('x', function (d) { return xDataDomain(d.key); })
      .attr('width', barWidth);
  }

  protected setBrushTooltipsPositions() {
    this.histogramParams.brushLeftTooltip.xContent = this.histogramParams.startValue;
    this.histogramParams.brushRightTooltip.xContent = this.histogramParams.endValue;

    const leftPosition = this.getAxes().xDomain(this.selectionInterval.startvalue);
    const rightPosition = this.getAxes().xDomain(this.selectionInterval.endvalue);

    if (this.histogramParams.leftBrushElement !== undefined && this.histogramParams.leftBrushElement !== null &&
      this.histogramParams.rightBrushElement !== undefined && this.histogramParams.rightBrushElement !== null) {
      const leftOffset = this.histogramParams.leftBrushElement.offsetWidth;
      const rightOffset = this.histogramParams.rightBrushElement.offsetWidth;
      if (leftOffset !== 0 && rightOffset !== 0) {
        if (leftPosition + leftOffset + 5 > rightPosition - rightOffset) {
          this.histogramParams.displayHorizontal = 'hidden';
          this.histogramParams.displayVertical = 'visible';
          this.setVerticalTooltipsWidth();
          this.setBrushVerticalTooltipsXPositions(leftPosition, rightPosition);
          this.setBrushVerticalTooltipsYPositions(leftPosition, rightPosition);
        } else {
          this.histogramParams.displayHorizontal = 'visible';
          this.histogramParams.displayVertical = 'hidden';
          this.setBrushHorizontalTooltipsXPositions(leftPosition, rightPosition);
          this.setBrushHorizontalTooltipsYPositions(leftPosition, rightPosition);
        }
      } else {
        this.histogramParams.displayHorizontal = 'hidden';
        this.histogramParams.displayVertical = 'hidden';
      }
    } else {
      this.histogramParams.displayHorizontal = 'hidden';
      this.histogramParams.displayVertical = 'hidden';
    }
  }

  protected setVerticalTooltipsWidth() {
    this.histogramParams.brushLeftTooltip.width = this.chartDimensions.height;
    this.histogramParams.brushRightTooltip.width = this.chartDimensions.height;
  }

  protected setBrushVerticalTooltipsXPositions(leftPosition: number, rightPosition: number) {
    this.histogramParams.brushLeftTooltip.xPosition = - this.chartDimensions.height + this.histogramParams.margin.left + leftPosition;
    this.histogramParams.brushRightTooltip.xPosition = this.histogramParams.margin.left + rightPosition;
  }

  protected setBrushVerticalTooltipsYPositions(leftPosition: number, rightPosition: number) {
    if (this.histogramParams.xAxisPosition === Position.bottom) {
      this.histogramParams.brushLeftTooltip.yPosition = this.chartDimensions.height + this.histogramParams.margin.bottom + 6;
    } else {
      this.histogramParams.brushLeftTooltip.yPosition = this.chartDimensions.height + this.histogramParams.margin.bottom -
        this.histogramParams.margin.top - 6;
    }
    this.histogramParams.brushRightTooltip.yPosition = this.histogramParams.brushLeftTooltip.yPosition;
  }

  protected setBrushHorizontalTooltipsXPositions(leftPosition: number, rightPosition: number) {
    this.histogramParams.brushLeftTooltip.xPosition = leftPosition + this.histogramParams.margin.left;
    this.histogramParams.brushRightTooltip.xPosition = this.histogramParams.margin.right + this.chartDimensions.width - rightPosition;
  }

  protected setBrushHorizontalTooltipsYPositions(leftPosition: number, rightPosition: number) {
    if (this.histogramParams.xAxisPosition === Position.bottom) {
      this.histogramParams.brushLeftTooltip.yPosition = this.chartDimensions.height + 10;
    } else {
      this.histogramParams.brushLeftTooltip.yPosition = -3;
    }
    this.histogramParams.brushRightTooltip.yPosition = this.histogramParams.brushLeftTooltip.yPosition;
  }

  protected getHistogramDataInterval(data: Array<HistogramData>): number {
    let interval = Number.MAX_VALUE;
    if (data.length > 1) {
      interval = +data[1].key - +data[0].key;
      // ##### Work around of substruction bug in js #####
      if (interval < 1) {
        const roundPrecision = HistogramUtils.getRoundPrecision(interval);
        interval = HistogramUtils.round(+data[1].key * Math.pow(10, roundPrecision) - +data[0].key * Math.pow(10, roundPrecision),
          roundPrecision);
        interval = interval * Math.pow(10, -roundPrecision);
      }
      // #################################################
    } else {
      interval = 0;
    }
    return interval;
  }

  protected abstract setDataInterval(data: Array<HistogramData> | Map<string, Array<HistogramData>>): void;
  protected abstract getDataInterval(data: Array<HistogramData> | Map<string, Array<HistogramData>>): number;
  protected abstract getAxes(): ChartAxes | SwimlaneAxes;
}
