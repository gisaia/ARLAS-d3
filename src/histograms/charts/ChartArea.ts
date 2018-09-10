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

import { AbstractChart } from './AbstractChart';
import { HistogramData, HistogramUtils, ChartAxes, DataType, SelectedOutputValues, Position } from '../utils/HistogramUtils';


export class ChartArea extends AbstractChart {
  private clipPathContext;
  private currentClipPathContext;
  private rectangleCurrentClipper;
  private selectedIntervals = new Map<string, {rect: any, startEndValues: SelectedOutputValues}>();

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

  public redrawSelectedIntervals(): void {
    super.redrawSelectedIntervals();
    this.selectedIntervals.forEach((rectClipper, guid) => { rectClipper.rect.remove(); });
    this.selectedIntervals.clear();
    this.histogramParams.intervalListSelection.forEach((v) => {
      if (this.histogramParams.dataType === DataType.time) {
        v.startvalue = new Date(+v.startvalue);
        v.endvalue = new Date(+v.endvalue);
      }
      const guid = HistogramUtils.getIntervalGUID(v.startvalue, v.endvalue);
      const rect = this.getAppendedRectangle(v.startvalue, v.endvalue);
      this.selectedIntervals.set(guid, {rect: rect, startEndValues: {startvalue : v.startvalue, endvalue: v.endvalue}});
    });
  }

  public removeSelectInterval(id: string) {
    super.removeSelectInterval(id);
    this.selectedIntervals.get(id).rect.remove();
    this.selectedIntervals.delete(id);
    const isSelectionBeyondDataDomain = HistogramUtils.isSelectionBeyondDataDomain(this.selectionInterval, this.dataDomain,
      this.histogramParams.intervalSelectedMap);
    if (!isSelectionBeyondDataDomain && this.hasSelectionExceededData) {
      this.plot(<Array<{key: number, value: number}>>this.histogramParams.data);
      this.hasSelectionExceededData = false;
    } else if (isSelectionBeyondDataDomain) {
      this.plot(<Array<{key: number, value: number}>>this.histogramParams.data);
    }
  }

  protected setDataInterval(data: Array<HistogramData>): void {
    this.dataInterval = 0;
  }

  protected moveDataByHalfInterval(data: Array<{key: number, value: number}>): Array<{key: number, value: number}> {
    const movedData = [];
    if (this.histogramParams.moveDataByHalfInterval) {
      const dataInterval = this.getDataInterval(data);
      data.forEach(d => {
        movedData.push({key: +d.key + dataInterval / 2, value: d.value});
      });
      return movedData;
    } else {
      return data;
    }
  }

  protected customizeData(data: Array<HistogramData>): void {
    const followingLastBucket = this.getFollowingLastBucket(data);
    data.push(followingLastBucket);
  }

  protected plotChart(data: Array<HistogramData>): void {
    this.clipPathContext = this.context.append('defs').append('clipPath')
      .attr('id', this.histogramParams.uid);
    this.currentClipPathContext = this.context.append('defs').append('clipPath')
      .attr('id', this.histogramParams.uid + '-currentselection');
    this.rectangleCurrentClipper = this.currentClipPathContext.append('rect')
      .attr('id', 'clip-rect')
      .attr('x', this.chartAxes.xDomain(this.selectionInterval.startvalue))
      .attr('y', '0')
      .attr('width', this.chartAxes.xDomain(this.selectionInterval.endvalue) - this.chartAxes.xDomain(this.selectionInterval.startvalue))
      .attr('height', this.chartDimensions.height );

    const curveType: d3.CurveFactory = (this.histogramParams.isSmoothedCurve) ? d3.curveMonotoneX : d3.curveLinear;
    const areaYPositon = (this.yStartsFromMin && this.histogramParams.showStripes) ?
      (0.9 * this.chartDimensions.height) : this.chartDimensions.height;
    const area = d3.area()
      .curve(curveType)
      .x((d: any) => this.chartAxes.xDataDomain(d.key))
      .y0(areaYPositon)
      .y1((d: any) => this.chartAxes.yDomain(d.value));

    this.context.append('g').attr('class', 'histogram__area-data')
      .append('path')
      .datum(data)
      .attr('class', 'histogram__chart--unselected--area')
      .attr('d', area);

    const urlFixedSelection = 'url(#' + this.histogramParams.uid + ')';
    this.context.append('g').attr('class', 'histogram__area-data').attr('clip-path', urlFixedSelection)
      .append('path')
      .datum(data)
      .attr('class', 'histogram__chart--fixed-selected--area')
      .attr('d', area);

    const urlCurrentSelection = 'url(#' + this.histogramParams.uid + '-currentselection)';
    this.context.append('g').attr('class', 'histogram__area-data').attr('clip-path', urlCurrentSelection)
      .append('path')
      .datum(data)
      .attr('class', 'histogram__chart--current-selected--area')
      .attr('d', area);

    // ADD STRIPPED AREAS
    if (this.yStartsFromMin && this.histogramParams.showStripes) {
      const id = this.histogramParams.uid;
      this.addStrippedPattern('unselected-area-' + id, 'histogram__stripped-unselected-area');
      this.addStrippedPattern('fixed-area-' + id, 'histogram__stripped-fixed-selected-area');
      this.addStrippedPattern('current-area-' + id, 'histogram__stripped-current-selected-area');
      this.context.append('g')
        .append('rect')
        .attr('x', '0')
        .attr('y', this.chartDimensions.height * 0.9)
        .attr('width', this.chartDimensions.width)
        .attr('height', this.chartDimensions.height * 0.1)
        .attr('fill', 'url(#unselected-area-' + id + ')');
      this.context.append('g')
        .append('rect').attr('clip-path', urlFixedSelection)
        .attr('x', '0')
        .attr('y', this.chartDimensions.height * 0.9)
        .attr('width', this.chartDimensions.width)
        .attr('height', this.chartDimensions.height * 0.1)
        .attr('fill', 'url(#fixed-area-' + id + ')');
      this.context.append('g')
        .append('rect').attr('clip-path', urlCurrentSelection)
        .attr('x', '0')
        .attr('y', this.chartDimensions.height * 0.9)
        .attr('width', this.chartDimensions.width)
        .attr('height', this.chartDimensions.height * 0.1)
        .attr('fill', 'url(#current-area-' + id + ')');
    }
  }

  protected createChartAxes(data: Array<HistogramData>): void {
    super.createChartAxes(data);
    this.chartAxes.stepWidth = 0;
    const startRange = this.chartAxes.xDomain(data[0].key);
    const endRange = this.chartAxes.xDomain(+data[data.length - 1].key);
    const xDataDomain = (this.getXDomainScale()).range([startRange, endRange]);
    xDataDomain.domain(d3.extent(data, (d: any) => d.key));
    this.chartAxes.xDataDomain = xDataDomain;
    this.chartAxes.xAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0);
    this.chartAxes.xTicksAxis = d3.axisBottom(this.chartAxes.xDomain).ticks(this.histogramParams.xTicks).tickSize(this.minusSign * 4);
    const labelPadding = (this.histogramParams.xAxisPosition === Position.bottom) ? 9 : -15;
    this.chartAxes.xLabelsAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0)
      .tickPadding(labelPadding).ticks(this.histogramParams.xLabels);
    this.applyFormatOnXticks(data);
    if (this.histogramParams.dataType === DataType.time && this.histogramParams.ticksDateFormat) {
      this.chartAxes.xLabelsAxis = this.chartAxes.xLabelsAxis.tickFormat(d3.timeFormat(this.histogramParams.ticksDateFormat));
    }
  }

  protected drawChartAxes(chartAxes: ChartAxes, leftOffset: number): void {
    super.drawChartAxes(chartAxes, leftOffset);
    this.drawYAxis(chartAxes);
  }

  protected onSelectionDoubleClick (axes: ChartAxes): void {
    this.brushContext.on('dblclick', () => {
      if (this.isBrushed) {
        const finalPosition = this.getIntervalMiddlePositon(axes, +this.selectionInterval.startvalue, +this.selectionInterval.endvalue);
        let guid;
        if ((typeof (<Date>this.selectionInterval.startvalue).getMonth === 'function')) {
          const startMilliString = (<Date>this.selectionInterval.startvalue).getTime().toString();
          const start = startMilliString.substring(0, startMilliString.length - 3);
          const endMilliString = (<Date>this.selectionInterval.endvalue).getTime().toString();
          const end = endMilliString.substring(0, endMilliString.length - 3);
          guid = start + '000' + end + '000';
        } else {
          guid = this.selectionInterval.startvalue.toString() + this.selectionInterval.endvalue.toString();
        }
        this.histogramParams.intervalSelectedMap.set(guid,
          {
            values: { startvalue: this.selectionInterval.startvalue, endvalue: this.selectionInterval.endvalue },
            x_position: finalPosition
          });
        if (this.histogramParams.selectionListIntervalId.indexOf(guid) < 0) {
          this.histogramParams.selectionListIntervalId.push(guid);
        }
        // ### Emits the selected interval
        const selectionListInterval = [];
        this.histogramParams.intervalSelectedMap.forEach((k, v) => selectionListInterval.push(k.values));
        this.histogramParams.valuesListChangedEvent.next(selectionListInterval.concat(this.selectionInterval));

        if (!this.selectedIntervals.has(guid)) {
          const rect = this.getAppendedRectangle(this.selectionInterval.startvalue, this.selectionInterval.endvalue);
          this.selectedIntervals.set(guid, {rect: rect, startEndValues: {startvalue : this.selectionInterval.startvalue,
             endvalue: this.selectionInterval.endvalue}});
        }
      } else {
        if (this.rectangleCurrentClipper !== null) {
          this.rectangleCurrentClipper.remove();
          this.rectangleCurrentClipper = null;
        }
      }
    });
  }

  protected onSelectionClick (): void {
    this.brushContext.on('click', () => {
      if (!this.isBrushed && this.rectangleCurrentClipper !== null) {
        this.rectangleCurrentClipper.remove();
        this.rectangleCurrentClipper = null;
      }
    });
  }

  protected getIntervalMiddlePositon(chartAxes: ChartAxes, startvalue: number, endvalue: number): number {
    return this.histogramParams.margin.left + chartAxes.xDomain(startvalue) +
      1 / 2 * (chartAxes.xDomain(endvalue) - chartAxes.xDomain(startvalue)) - 24 / 2;
  }

  protected updateSelectionStyle(id: string): void {}

  protected addSelectionBrush(chartAxes: ChartAxes, leftOffset: number): void {
    super.addSelectionBrush(chartAxes, leftOffset);
    this.applyStyleOnSelection();
    this.onSelectionClick();
    if (this.histogramParams.multiselectable) {
      this.onSelectionDoubleClick(chartAxes);
    }
  }

  protected applyStyleOnSelection() {
    if (this.rectangleCurrentClipper === null) {
      this.rectangleCurrentClipper = this.currentClipPathContext.append('rect')
        .attr('id', 'clip-rect')
        .attr('x', this.chartAxes.xDomain(this.selectionInterval.startvalue))
        .attr('y', '0')
        .attr('width', this.chartAxes.xDomain(this.selectionInterval.endvalue) - this.chartAxes.xDomain(this.selectionInterval.startvalue))
        .attr('height', this.chartDimensions.height );
    } else {
      this.rectangleCurrentClipper
        .attr('x', this.chartAxes.xDomain(this.selectionInterval.startvalue))
        .attr('width', this.chartAxes.xDomain(this.selectionInterval.endvalue) - this.chartAxes.xDomain(this.selectionInterval.startvalue));
    }
  }

  protected resizeSelectedIntervals(chartAxes: ChartAxes) {
    super.resizeSelectedIntervals(chartAxes);
    this.selectedIntervals.forEach((rect, guid) => {
      rect.rect.remove();
      const rectangle = this.getAppendedRectangle(rect.startEndValues.startvalue, rect.startEndValues.endvalue);
      this.selectedIntervals.set(guid, {rect: rectangle, startEndValues: rect.startEndValues});
    });
  }

  protected getStartPosition(data: Array<HistogramData>, index: number): number {
    return this.chartAxes.xDomain(data[index].key) - 10;
  }

  protected getEndPosition(data: Array<HistogramData>, index: number): number {
    return this.chartAxes.xDomain(data[index].key) + 10;
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

  protected getAxes() {
    return this.chartAxes;
  }

  protected setTooltipYposition(yPosition: number): number {
    return -10;
  }

  private getAppendedRectangle (start: Date | number, end: Date | number): any {
    return this.clipPathContext.append('rect')
    .attr('id', 'clip-rect')
    .attr('x', this.chartAxes.xDomain(start))
    .attr('y', '0')
    .attr('width', this.chartAxes.xDomain(end) - this.chartAxes.xDomain(start))
    .attr('height', this.chartDimensions.height );
  }
}
