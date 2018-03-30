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

import * as d3 from 'd3';

import { HistogramData, HistogramUtils, ChartAxes, DataType, ChartDimensions } from '../utils/HistogramUtils';
import { AbstractChart } from './AbstractChart';


export class ChartOneDimension extends AbstractChart {

  public resize(histogramContainer: HTMLElement): void {
    super.resize(histogramContainer);
    this.plot(<Array<{ key: number, value: number }>>this.histogramParams.data);
    if (this.histogramParams.multiselectable) {
      this.resizeSelectedIntervals(this.chartAxes);
    }
  }

  protected plotChart(data: Array<HistogramData>): void {
    this.plotBars(data, this.chartAxes, this.chartAxes.xDataDomain);
    this.barsContext
      .attr('height', (d) => this.chartDimensions.height)
      .style('fill', (d) => HistogramUtils.getColor(d.value, this.histogramParams.paletteColors).toHexString())
      .style('stroke', (d) => HistogramUtils.getColor(d.value, this.histogramParams.paletteColors).toHexString())
      .style('opacity', '0.8');
  }

  protected initializeChartDimensions(): void {
    this.histogramParams.chartHeight = 8 + this.histogramParams.margin.top + this.histogramParams.margin.bottom;
    this.yDimension = 0;
    this.histogramParams.barWeight = 1;
    this.histogramParams.topOffsetRemoveInterval = -5;
    super.initializeChartDimensions();
  }

  protected createChartAxes(data: Array<HistogramData>): void {
    super.createChartAxes(data);
    this.chartAxes.stepWidth = 0;
    const startRange = this.chartAxes.xDomain(data[0].key);
    const endRange = this.chartAxes.xDomain(+data[data.length - 1].key + this.dataInterval);
    if (data.length > 1) {
      this.chartAxes.stepWidth = this.chartAxes.xDomain(data[1].key) - this.chartAxes.xDomain(data[0].key);
    } else {
      this.chartAxes.stepWidth = this.chartDimensions.width;
    }
    this.chartAxes.xDataDomain = d3.scaleBand().range([startRange, endRange]).paddingInner(0);
    this.chartAxes.xDataDomain.domain(data.map((d) => d.key));
    const ticksPeriod = Math.max(1, Math.round(data.length / this.histogramParams.xTicks));
    const labelsPeriod = Math.max(1, Math.round(data.length / this.histogramParams.xLabels));
    if (this.histogramParams.dataType === DataType.numeric) {
      this.chartAxes.xTicksAxis = d3.axisBottom(this.chartAxes.xDomain).tickPadding(5).tickValues(this.chartAxes.xDataDomain.domain()
        .filter((d, i) => !(i % ticksPeriod))).tickSize(this.minusSign * 5);
      this.chartAxes.xLabelsAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0).tickPadding(this.minusSign * 12)
      .tickValues(this.chartAxes.xDataDomain.domain()
        .filter((d, i) => !(i % labelsPeriod)));
    } else {
      this.chartAxes.xTicksAxis = d3.axisBottom(this.chartAxes.xDomain).ticks(this.histogramParams.xTicks).tickSize(this.minusSign * 5);
      this.chartAxes.xLabelsAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0)
      .tickPadding(this.minusSign * 12).ticks(this.histogramParams.xLabels);
    }
    this.chartAxes.xAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0);
  }

  protected drawChartAxes(chartAxes: ChartAxes, leftOffset: number): void {
    super.drawChartAxes(chartAxes, leftOffset);
  }

  protected addSelectionBrush(chartAxes: ChartAxes, leftOffset: number): void {
    super.addSelectionBrush(chartAxes, leftOffset);
    if (this.histogramParams.multiselectable) {
      this.onSelectionDoubleClick(chartAxes);
    }
    this.applyStyleOnSelection();
  }

  protected applyStyleOnSelection() {
    this.applyStyleOnSelectedBars(this.barsContext);
  }

  protected getStartPosition(data: Array<HistogramData>, index: number): number {
    return this.chartAxes.xDomain(data[index].key);
  }

  protected getEndPosition(data: Array<HistogramData>, index: number): number {
    return this.chartAxes.xDomain(data[index].key) + this.chartAxes.stepWidth * this.histogramParams.barWeight;
  }

  protected setTooltipXposition(xPosition: number): number {
    this.histogramParams.tooltip.isShown = false;
    return 0;
  }

  protected setTooltipYposition(yPosition: number): number {
    return 0;
  }

  protected getAxes() {
    return this.chartAxes;
  }

  protected setDataInterval(data: Array<HistogramData>): void {
    let interval = Number.MAX_VALUE;
    if (data.length > 1) {
      for (let i = 0; i < (data.length - 1); i++) {
        if (this.histogramParams.dataType === DataType.time) {
          interval = Math.min(interval, +data[i + 1].key - +data[i].key);
        } else {
          interval = Math.min(interval, +data[i + 1].key - +data[i].key);
        }
      }
      if (interval === Number.MAX_VALUE) {
        interval = 0;
      }
    } else {
      // three cases
      if (data[0].key === this.selectionInterval.startvalue && data[0].key === this.selectionInterval.endvalue) {
        interval = 1;
      } else if (data[0].key === this.selectionInterval.startvalue || data[0].key === this.selectionInterval.endvalue) {
        const isoInterval = Math.max(Math.abs(+data[0].key
          - +this.selectionInterval.startvalue), Math.abs(+data[0].key - +this.selectionInterval.endvalue));
        interval = Math.min(1, isoInterval);
      } else {
        interval = Math.min(1, Math.abs(+data[0].key
          - +this.selectionInterval.startvalue), Math.abs(+data[0].key - +this.selectionInterval.endvalue));
      }
    }
    this.dataInterval = interval;
  }

  protected setVerticalTooltipsWidth() {
    this.histogramParams.brushLeftTooltip.width = 40;
    this.histogramParams.brushRightTooltip.width = 40;
  }

  protected setBrushVerticalTooltipsXPositions(leftPosition: number, rightPosition: number) {
    this.histogramParams.brushLeftTooltip.xPosition = -40 + this.histogramParams.margin.left + leftPosition;
    this.histogramParams.brushRightTooltip.xPosition = this.histogramParams.margin.left + rightPosition;
  }


}
