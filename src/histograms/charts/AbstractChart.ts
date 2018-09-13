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

import { AbstractHistogram } from '../AbstractHistogram';
import { HistogramData, HistogramUtils, ChartAxes, DataType } from '../utils/HistogramUtils';
import * as d3 from 'd3';


export abstract class AbstractChart extends AbstractHistogram {

  protected chartAxes: ChartAxes;
  protected yStartsFromMin = false;

  public plot(inputData: Array<{ key: number, value: number }>) {
    super.plot(inputData);
    this.dataDomain = inputData;
    if (inputData !== null && Array.isArray(inputData) && inputData.length > 0) {
      const movedData = this.moveDataByHalfInterval(inputData);
      const data = HistogramUtils.parseDataKey(movedData, this.histogramParams.dataType);
      this.histogramParams.dataLength = data.length;
      const minMaxBorders = this.getHistogramMinMaxBorders(data);
      this.initializeDescriptionValues(minMaxBorders[0], minMaxBorders[1]);
      this.initializeChartDimensions();
      this.createChartAxes(data);
      this.drawChartAxes(this.chartAxes, 0);
      this.customizeData(data);
      this.plotChart(data);
      this.showTooltips(data);
      if (this.histogramParams.isHistogramSelectable) {
        this.addSelectionBrush(this.chartAxes, 0);
      }
      this.plottingCount++;
    } else {
      this.histogramParams.startValue = '';
      this.histogramParams.endValue = '';
      this.histogramParams.dataLength = 0;
      this.histogramParams.displaySvg = 'none';
    }
  }

  public resize(histogramContainer: HTMLElement): void {
    this.histogramParams.histogramContainer = histogramContainer;
    if (this.isWidthFixed === false && this.plottingCount > 0) {
      this.histogramParams.chartWidth = this.histogramParams.histogramContainer.offsetWidth;
    }

    if (this.isHeightFixed === false && this.plottingCount > 0) {
      this.histogramParams.chartHeight = this.histogramParams.histogramContainer.offsetHeight;
    }
  }

  public removeSelectInterval(id: string) {
    super.removeSelectInterval(id);
    const isSelectionBeyondDataDomain = HistogramUtils.isSelectionBeyondDataDomain(this.selectionInterval, this.dataDomain,
      this.histogramParams.intervalSelectedMap);
    if (!isSelectionBeyondDataDomain && this.hasSelectionExceededData) {
      this.plot(<Array<{key: number, value: number}>>this.histogramParams.data);
      this.hasSelectionExceededData = false;
    } else if (isSelectionBeyondDataDomain) {
      this.plot(<Array<{key: number, value: number}>>this.histogramParams.data);
    }
  }

  protected moveDataByHalfInterval(data: Array<{key: number, value: number}>): Array<{key: number, value: number}> {
    return data;
  }

  protected customizeData(data: Array<HistogramData>): void {}

  protected initializeChartDimensions(): void {
    super.initializeChartDimensions();
    if (this.histogramParams.dataLength > 1) {
      this.histogramParams.displaySvg = 'block';
    } else {
      this.histogramParams.displaySvg = 'none';
    }
    this.initializeChartHeight();
    const svg = d3.select(this.histogramParams.svgNode);
    const margin = this.histogramParams.margin;
    const width = Math.max(+this.histogramParams.chartWidth - this.histogramParams.margin.left - this.histogramParams.margin.right, 0);
    const height = Math.max(+this.histogramParams.chartHeight - this.histogramParams.margin.top -
      this.histogramParams.margin.bottom - 2, 0);
    this.chartDimensions = { svg, margin, width, height };
  }

  protected createChartAxes(data: Array<HistogramData>): void {
    const xDomain = (this.getXDomainScale()).range([0, this.chartDimensions.width]);
    // The xDomain extent includes data domain and selected values
    const xDomainExtent = this.getXDomainExtent(data, this.selectionInterval.startvalue,
       this.selectionInterval.endvalue);
    xDomain.domain(xDomainExtent);
    // xDataDomain includes data domain only
    const xDataDomain = null;
    const xAxis = null;
    const xTicksAxis = null;
    const xLabelsAxis = null;
    const stepWidth = null;
    let yDomain = d3.scaleLinear().range([this.chartDimensions.height, 0]);
    let maxOffset = d3.max(data, (d: any) => d.value) * 0.05;
    yDomain.domain([0, d3.max(data, (d: any) => d.value) + maxOffset]);
    const yAllDomain = yDomain;
    // IF WE WANT TO START THE HISTOGRAM FROM MIN OF DATA INSTEAD OF 0
    if (!this.histogramParams.yAxisFromZero) {
      // FIRST WE CHECK IF THE MINIMUM OF DATA IS GREATER THAN 30% OF THE CHART HEIGHT
      // IF SO, THEN THE CHART WILL START FROM THE MINIMUM OF DATA INSTEAD OF 0
      if (this.chartDimensions.height - yDomain(d3.min(data, (d: any) => d.value)) >= 0.3 * this.chartDimensions.height) {
        // THE `showStripes` OPTION DECIDES WETHER WE ADD STIPPED AREA/BARS TO THE HISTOGRAMS
        // IF `showStripes == TRUE` THEN STRIPES WILL OCCUPY 10% OF THE CHARTHEIGHT AND THE DATA VARIATION WILL OCCUPY 90% OF THE CHART
        // IF `showStripes == FALSE` THEN NO STRIPES WILL BE DISPLAYED. HOWEVER, THE CHART STARTS FROM MIN OF DATA - A DOMAINOFFSET
        const yMaxRange = this.histogramParams.showStripes ? (0.9 * this.chartDimensions.height ) : this.chartDimensions.height;
        this.yStartsFromMin = true;
        yDomain = d3.scaleLinear().range([yMaxRange, 0]);
        const minOffset = this.histogramParams.showStripes ? 0 : 0.1 * (d3.max(data, (d) => d.value) - d3.min(data, (d) => d.value));
        maxOffset = 0.05 * (d3.max(data, (d) => d.value) - d3.min(data, (d) => d.value));
        yDomain.domain([d3.min(data, (d: any) => d.value) - minOffset, d3.max(data, (d: any) => d.value) + maxOffset]);
      } else {
        this.yStartsFromMin = false;
      }
    }
    const yTicksAxis = d3.axisLeft(yDomain).ticks(this.histogramParams.yTicks).tickSizeOuter(0);
    const yLabelsAxis = d3.axisLeft(yDomain).tickSize(0).tickPadding(10).ticks(this.histogramParams.yLabels);
    const yAxis = d3.axisLeft(yAllDomain).tickSize(0).ticks(0);
    this.chartAxes = { xDomain, xDataDomain, yDomain, xTicksAxis, yTicksAxis, stepWidth, xLabelsAxis, yLabelsAxis, xAxis, yAxis };
  }

  protected drawYAxis(chartAxes: ChartAxes): void {
    // yTicksAxis and yLabelsAxis are translated of 1px to the left so that they are not hidden by the histogram
    this.yTicksAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__ticks-axis')
      .attr('transform', 'translate(-1, 0)')
      .call(chartAxes.yTicksAxis);
    this.yLabelsAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__labels-axis')
      .attr('transform', 'translate(-1, 0)')
      .call(chartAxes.yLabelsAxis);
    this.yAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__only-axis')
      .attr('transform', 'translate(-1, 0)')
      .call(chartAxes.yAxis);
    // Define css classes for the ticks, labels and the axes
    this.yTicksAxis.selectAll('path').attr('class', 'histogram__axis');
    this.yTicksAxis.selectAll('line').attr('class', 'histogram__ticks');
    this.yLabelsAxis.selectAll('text').attr('class', 'histogram__labels');
    if (!this.histogramParams.showYTicks) {
      this.yTicksAxis.selectAll('g').attr('class', 'histogram__ticks-axis__hidden');
    }
    if (!this.histogramParams.showYLabels) {
      this.yLabelsAxis.attr('class', 'histogram__labels-axis__hidden');
    }

    if (this.histogramParams.showHorizontalLines) {
      const horizontalAxes  = this.context.append('g')
        .attr('class', 'histogram__horizontal-axis')
        .call(this.chartAxes.yTicksAxis.tickSize(-this.chartDimensions.width));
      horizontalAxes.selectAll('line').attr('class', 'histogram__horizontal-axis__line');
      horizontalAxes.selectAll('text').attr('class', 'histogram__horizontal-axis__text');
    }
  }

  protected showTooltips(data: Array<HistogramData>): void {
    if (this.histogramParams.dataUnit !== '') { this.histogramParams.dataUnit = '(' + this.histogramParams.dataUnit + ')'; }
    this.context
      .on('mousemove', () => {
        const previousHoveredBucketKey = this.hoveredBucketKey;
        this.hoveredBucketKey = null;
        this.setTooltipPositions(data, <d3.ContainerElement>this.context.node());
        if (this.hoveredBucketKey !== previousHoveredBucketKey && this.hoveredBucketKey !== null) {
          this.histogramParams.hoveredBucketEvent.next(this.hoveredBucketKey);
        }
      })
      .on('mouseout', () => this.histogramParams.tooltip.isShown = false);
  }

  protected setTooltipPositions(data: Array<HistogramData>, container: d3.ContainerElement): void {
    const xy = d3.mouse(container);
    let dx;
    let dy;
    let startPosition;
    let endPosition;
    const dataInterval = this.getDataInterval(<Array<HistogramData>>this.histogramParams.data);

    for (let i = 0; i < data.length; i++) {
      this.histogramParams.tooltip.isShown = true;
      startPosition = this.getStartPosition(data, i);
      endPosition = this.getEndPosition(data, i);
      dx = this.setTooltipXposition(xy[0]);
      dy = this.setTooltipYposition(xy[1]);
      if (xy[0] >= startPosition && xy[0] < endPosition && !this.isBrushing) {
        this.hoveredBucketKey = data[i].key;
        if (data[i].key >= this.selectionInterval.startvalue && data[i].key <= this.selectionInterval.endvalue) {
          if (xy[1] < this.chartAxes.yDomain(data[i].value) && this.histogramParams.multiselectable) {
            this.histogramParams.tooltip.xContent = 'Double click';
            this.histogramParams.tooltip.yContent = 'to save this period';
          } else {
            this.histogramParams.tooltip.xContent = HistogramUtils.toString(data[i].key, this.histogramParams.chartType,
              this.histogramParams.dataType, this.histogramParams.moveDataByHalfInterval,
              this.histogramParams.valuesDateFormat, dataInterval);
            this.histogramParams.tooltip.yContent = data[i].value.toString();
          }
        } else {
          this.histogramParams.tooltip.xContent = HistogramUtils.toString(data[i].key,
            this.histogramParams.chartType, this.histogramParams.dataType, this.histogramParams.moveDataByHalfInterval,
              this.histogramParams.valuesDateFormat, dataInterval);
          this.histogramParams.tooltip.yContent = data[i].value.toString();
        }
        break;
      } else {
        if (data[i].key >= this.selectionInterval.startvalue
          && data[i].key <= this.selectionInterval.endvalue && this.histogramParams.multiselectable) {
          this.histogramParams.tooltip.xContent = 'Double click';
          this.histogramParams.tooltip.yContent = 'to save this period';
        } else {
          this.histogramParams.tooltip.isShown = false;
        }
      }
    }
    this.histogramParams.tooltip.xPosition = (xy[0] + dx);
    this.histogramParams.tooltip.yPosition = (xy[1] + dy);
  }

  protected getIntervalMiddlePositon(chartAxes: ChartAxes, startvalue: number, endvalue: number): number {
    const keys = this.getSelectedBars(startvalue, endvalue);
    return this.histogramParams.margin.left + chartAxes.xDomain(startvalue) + 1 / 2 *
     (chartAxes.xDomain(endvalue) - chartAxes.xDomain(startvalue)) - 24 / 2;
  }

  protected getSelectedBars(startvalue: number, endvalue: number): Array<number> {
    const keys = new Array<number>();
    const bars = HistogramUtils.parseDataKey(<Array<{key: number; value: number}>>this.histogramParams.data, this.histogramParams.dataType);
    bars.forEach((d) => {
      if (+d.key >= startvalue
        && +d.key + this.histogramParams.barWeight * this.dataInterval <= +endvalue) {
        this.selectedBars.add(+d.key);
        keys.push(+d.key);
      }
    });
    return keys;
  }

  protected addStrippedPattern(id: string, cssClass: string): void {
    this.context.append('defs')
      .append('pattern')
        .attr('id', id)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 4)
        .attr('height', 4)
      .append('path')
        .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
        .attr('class', cssClass);
  }

  protected applyFormatOnXticks(data: Array<HistogramData>): void {
    const interval = this.getHistogramDataInterval(data);
    if (interval > 0 && interval < 1) {
        const roundPrecision = HistogramUtils.getRoundPrecision(interval);
        this.chartAxes.xLabelsAxis = this.chartAxes.xLabelsAxis.tickFormat(d3.format('.' + roundPrecision + 'f'));
    }
  }

  protected setDataInterval(data: Array<HistogramData>): void {
    this.dataInterval = this.getDataInterval(data);
  }

  protected getDataInterval(data: Array<HistogramData>): number {
    return this.getHistogramDataInterval(data);
  }

  protected getAxes() {
    return this.chartAxes;
  }

  protected abstract plotChart(data: Array<HistogramData>): void;
  protected abstract getStartPosition(data: Array<HistogramData>, index: number): number;
  protected abstract getEndPosition(data: Array<HistogramData>, index: number): number;
  protected abstract setTooltipXposition(xPosition: number): number;
  protected abstract setTooltipYposition(yPosition: number): number;

}
