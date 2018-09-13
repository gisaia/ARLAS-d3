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

import { HistogramData, HistogramUtils, ChartAxes, DataType, Position } from '../utils/HistogramUtils';
import { AbstractChart } from './AbstractChart';


export class ChartBars extends AbstractChart {

  private strippedBarsContext;

  public plot(inputData: Array<{ key: number, value: number }>) {
    super.plot(inputData);
  }

  public resize(histogramContainer: HTMLElement): void {
    super.resize(histogramContainer);
    this.plot(<Array<{ key: number, value: number }>>this.histogramParams.data);
    if (this.histogramParams.multiselectable) {
      this.resizeSelectedIntervals(this.chartAxes);
    }
  }

  protected plotChart(data: Array<HistogramData>): void {
    this.plotBars(data, this.chartAxes, this.chartAxes.xDataDomain);
    const barsHeight = (this.yStartsFromMin && this.histogramParams.showStripes) ?
     (0.9 * this.chartDimensions.height) : this.chartDimensions.height;
    this.barsContext
    .attr('y', (d) =>  this.chartAxes.yDomain(d.value))
    .attr('height', (d) => barsHeight - this.chartAxes.yDomain(d.value));
    // ADD STRIPPED BARS
    if (this.yStartsFromMin && this.histogramParams.showStripes) {
      const id = this.histogramParams.uid;
      this.addStrippedPattern('unselected-bars-' + id, 'histogram__stripped-unselected-bar');
      this.addStrippedPattern('partly-selected-bars-' + id, 'histogram__stripped-partlyselected-bar');
      this.addStrippedPattern('current-selected-bars-' + id, 'histogram__stripped-currentselected-bar');
      this.addStrippedPattern('fully-selected-bars-' + id, 'histogram__stripped-fullyselected-bar');
      this.strippedBarsContext = this.context.append('g').attr('class', 'histogram__bars').selectAll('.bar')
        .data(data)
        .enter().append('rect')
        .attr('class', 'histogram__chart--bar')
        .attr('x', (d) => this.chartAxes.xDataDomain(d.key))
        .attr('width', this.chartAxes.stepWidth * this.histogramParams.barWeight)
        .attr('y', (d) => 0.9 * this.chartDimensions.height)
        .attr('height', (d) => 0.1 * this.chartDimensions.height);
    }
  }

  protected createChartAxes(data: Array<HistogramData>): void {
    super.createChartAxes(data);
    this.chartAxes.stepWidth = 0;
    const startRange = this.chartAxes.xDomain(data[0].key);
    const endRange = this.chartAxes.xDomain(+data[data.length - 1].key + this.dataInterval);
    if (data.length > 1) {
      this.chartAxes.stepWidth = this.chartAxes.xDomain(data[1].key) - this.chartAxes.xDomain(data[0].key);
    } else {
      if (data[0].key === this.selectionInterval.startvalue && data[0].key === this.selectionInterval.endvalue) {
        this.chartAxes.stepWidth = this.chartAxes.xDomain(data[0].key) / (this.histogramParams.barWeight * 10);
      } else {
        this.chartAxes.stepWidth = this.chartAxes.xDomain(<number>data[0].key + this.dataInterval) - this.chartAxes.xDomain(data[0].key);
      }
    }
    this.chartAxes.xDataDomain = d3.scaleBand().range([startRange, endRange]).paddingInner(0);
    this.chartAxes.xDataDomain.domain(data.map((d) => d.key));
    const ticksPeriod = Math.max(1, Math.round(data.length / this.histogramParams.xTicks));
    const labelsPeriod = Math.max(1, Math.round(data.length / this.histogramParams.xLabels));
    const labelPadding = (this.histogramParams.xAxisPosition === Position.bottom) ? 9 : -15;
    if (this.histogramParams.dataType === DataType.numeric) {
      this.chartAxes.xTicksAxis = d3.axisBottom(this.chartAxes.xDomain).tickValues(this.chartAxes.xDataDomain.domain()
        .filter((d, i) => !(i % ticksPeriod))).tickSize(this.minusSign * 4);
      this.chartAxes.xLabelsAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0).tickPadding(labelPadding)
        .tickValues(this.chartAxes.xDataDomain.domain().filter((d, i) => !(i % labelsPeriod)));
      this.applyFormatOnXticks(data);
    } else {
      this.chartAxes.xTicksAxis = d3.axisBottom(this.chartAxes.xDomain).ticks(this.histogramParams.xTicks).tickSize(this.minusSign * 4);
      this.chartAxes.xLabelsAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0).tickPadding(labelPadding)
      .ticks(this.histogramParams.xLabels);
    }
    this.chartAxes.xAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0);
  }

  protected drawChartAxes(chartAxes: ChartAxes, leftOffset: number): void {
    super.drawChartAxes(chartAxes, leftOffset);
    this.drawYAxis(chartAxes);
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
    if (this.yStartsFromMin && this.histogramParams.showStripes) {
      // APPLY STYLE ON STRIPPED BARS ACCORDING TO SELECTION TYPE : CURRENT, PARTLY, FULLY SELECTED BARS
      this.applyStyleOnStrippedSelectedBars(this.strippedBarsContext);
    }
  }

  protected applyStyleOnStrippedSelectedBars(barsContext: any): void {
    barsContext.filter((d) => this.selectedBars.has(+d.key)).attr('fill', 'url(#fully-selected-bars-' + this.histogramParams.uid + ')');
    barsContext.filter((d) => +d.key >= this.selectionInterval.startvalue
    && +d.key + this.histogramParams.barWeight * this.dataInterval <= this.selectionInterval.endvalue)
      .attr('fill', 'url(#current-selected-bars-' + this.histogramParams.uid + ')');
    barsContext.filter((d) => (+d.key < this.selectionInterval.startvalue || +d.key > this.selectionInterval.endvalue)
    && (!this.selectedBars.has(+d.key)))
      .attr('fill', 'url(#unselected-bars-' + this.histogramParams.uid + ')');

    barsContext.filter((d) => +d.key < this.selectionInterval.startvalue && (!this.selectedBars.has(+d.key))
    && +d.key + this.histogramParams.barWeight * this.dataInterval > this.selectionInterval.startvalue)
    .attr('fill', 'url(#partly-selected-bars-' + this.histogramParams.uid + ')');

    barsContext.filter((d) => +d.key <= this.selectionInterval.endvalue && (!this.selectedBars.has(+d.key))
    && +d.key + this.histogramParams.barWeight * this.dataInterval > this.selectionInterval.endvalue)
    .attr('fill', 'url(#partly-selected-bars-' + this.histogramParams.uid + ')');
  }

  protected getStartPosition(data: Array<HistogramData>, index: number): number {
    return this.chartAxes.xDomain(data[index].key);
  }

  protected getEndPosition(data: Array<HistogramData>, index: number): number {
    return this.chartAxes.xDomain(data[index].key) + this.chartAxes.stepWidth * this.histogramParams.barWeight;
  }

  protected setTooltipXposition(xPosition: number): number {
    if (xPosition > this.chartDimensions.width / 2) {
      this.histogramParams.tooltip.isRightSide = true;
      return (this.chartDimensions.width) - 2 * xPosition + 25;
    } else {
      this.histogramParams.tooltip.isRightSide = false;
      if (!this.histogramParams.showYLabels) {
        return 30;
      } else {
        return 80;
      }
    }
  }

  protected setTooltipYposition(yPosition: number): number {
    return (this.minusSign === 1) ? -10 : 20;
  }

  protected getAxes() {
    return this.chartAxes;
  }
}
