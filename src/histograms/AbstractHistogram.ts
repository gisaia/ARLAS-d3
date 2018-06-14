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
import { Subject } from 'rxjs/Subject';
import * as d3 from 'd3';
import { HistogramParams } from './HistogramParams';

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
  protected selectionBrush: d3.BrushBehavior<any>;
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

  public setSelectedInterval(selectedInputValues: SelectedInputValues): void {
    const axes = this.getAxes();
    this.checkSelectedValuesValidity(selectedInputValues);
    this.fromSetInterval = true;
    const parsedSelectedValues = HistogramUtils.parseSelectedValues(selectedInputValues, this.histogramParams.dataType);
    if (parsedSelectedValues.startvalue !== this.selectionInterval.startvalue ||
      parsedSelectedValues.endvalue !== this.selectionInterval.endvalue) {
      this.selectionInterval.startvalue = parsedSelectedValues.startvalue;
      this.selectionInterval.endvalue = parsedSelectedValues.endvalue;
      const dataInterval = this.getDataInterval(this.histogramParams.data);
      this.histogramParams.startValue = HistogramUtils.toString(this.selectionInterval.startvalue, this.histogramParams.chartType,
        this.histogramParams.dataType, this.histogramParams.valuesDateFormat, dataInterval);
      this.histogramParams.endValue = HistogramUtils.toString(this.selectionInterval.endvalue, this.histogramParams.chartType,
        this.histogramParams.dataType, this.histogramParams.valuesDateFormat, dataInterval);
      const data = this.dataDomain;
      if (data !== null) {
        if (HistogramUtils.isSelectionBeyondDataDomain(selectedInputValues, <Array<{ key: number, value: number }>>data,
          this.histogramParams.intervalSelectedMap)) {
          this.hasSelectionExceededData = true;
          this.plot(this.histogramParams.data);
        } else {
          if (this.hasSelectionExceededData) {
            this.hasSelectionExceededData = false;
            this.plot(this.histogramParams.data);
          }
          const selectionBrushStart = Math.max(0, axes.xDomain(this.selectionInterval.startvalue));
          const selectionBrushEnd = Math.min(axes.xDomain(this.selectionInterval.endvalue), (this.chartDimensions).width);
          if (this.context) {
            this.context.select('.brush').call(this.selectionBrush.move, [selectionBrushStart, selectionBrushEnd]);
          }
        }
      }
    }
    this.fromSetInterval = false;
  }

  public removeSelectInterval(id: string) {
    this.histogramParams.tooltip.isShown = false;
    const index = this.histogramParams.selectionListIntervalId.indexOf(id, 0);
    if (index > -1) {
      this.histogramParams.selectionListIntervalId.splice(index, 1);
    }
    this.updateSelectionStyle(id);
    this.histogramParams.intervalSelectedMap.delete(id);
    const selectionListInterval = [];
    this.histogramParams.intervalSelectedMap.forEach((k, v) => selectionListInterval.push(k.values));
    this.histogramParams.valuesListChangedEvent.next(selectionListInterval.concat(this.selectionInterval));
  }

  public redrawSelectedIntervals() {
    const axes = this.getAxes();
    this.selectedBars.clear();
    this.histogramParams.selectionListIntervalId = [];
    this.histogramParams.intervalSelectedMap.clear();
    this.histogramParams.intervalListSelection.forEach((v) => {
      if (this.histogramParams.dataType === DataType.time) {
        v.startvalue = new Date(+v.startvalue);
        v.endvalue = new Date(+v.endvalue);
      }
      const finalPosition = this.getIntervalMiddlePositon(axes, +v.startvalue, +v.endvalue);
      const guid = HistogramUtils.getIntervalGUID(v.startvalue, v.endvalue);
      this.histogramParams.intervalSelectedMap.set(guid,
        {
          values: { startvalue: v.startvalue, endvalue: v.endvalue },
          x_position: finalPosition
        });
      if (this.histogramParams.selectionListIntervalId.indexOf(guid) < 0) {
        this.histogramParams.selectionListIntervalId.push(guid);
      }
    });
    if (this.barsContext !== undefined) {
      this.applyStyleOnSelection();
    }
  }

  public overRemove(e) {
    if (e.path[1].offsetTop !== undefined && e.clientX !== undefined) {
      this.histogramParams.tooltip.isRightSide = true;
      const dx = (this.chartDimensions.width) - 2 * e.clientX + 25;
      this.histogramParams.tooltip.xContent = 'Remove this';
      this.histogramParams.tooltip.yContent = 'period';
      this.histogramParams.tooltip.isShown = true;
      this.histogramParams.tooltip.xPosition = (e.clientX + dx);
      this.histogramParams.tooltip.yPosition = (e.path[1].offsetTop + 30);
    }
  }

  public leaveRemove() {
    this.histogramParams.tooltip.isShown = false;
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

  protected updateSelectionStyle(id: string) {
    const startEndValues = this.histogramParams.intervalSelectedMap.get(id);
    this.dataDomain.forEach(bar => {
      if (+bar.key >= +startEndValues.values.startvalue &&
        +bar.key + this.histogramParams.barWeight * this.dataInterval <= +startEndValues.values.endvalue) {
        this.selectedBars.delete(+bar.key);
      }
    });
    this.applyStyleOnSelection();
  }

  protected initializeDescriptionValues(start: Date | number, end: Date | number) {
    if (!this.fromSetInterval && this.histogramParams.hasDataChanged) {
      const dataInterval = this.getDataInterval(this.histogramParams.data);

      this.histogramParams.startValue = HistogramUtils.toString(start, this.histogramParams.chartType,
        this.histogramParams.dataType, this.histogramParams.valuesDateFormat, dataInterval);
      this.selectionInterval.startvalue = start;

      this.histogramParams.endValue = HistogramUtils.toString(end, this.histogramParams.chartType,
        this.histogramParams.dataType, this.histogramParams.valuesDateFormat, dataInterval);
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
    return (this.histogramParams.dataType === DataType.time) ? d3.scaleTime() : d3.scaleLinear();
  }

  protected getXDomainExtent(data: Array<HistogramData>, selectedStartValue: Date | number,
    selectedEndValue: Date | number): Array<Date | number | { valueOf(): number }> {
    this.setDataInterval(data);
    const xDomainExtent = new Array<Date | number | { valueOf(): number }>();
    const dataKeyUnionSelectedValues = new Array<Date | number>();
    data.forEach(d => {
      dataKeyUnionSelectedValues.push(d.key);
    });

    this.histogramParams.intervalSelectedMap.forEach(values => {
      if (selectedStartValue > values.values.startvalue) {
        selectedStartValue = values.values.startvalue;
      }
      if (selectedEndValue < values.values.endvalue) {
        selectedEndValue = values.values.endvalue;
      }
    });

    dataKeyUnionSelectedValues.push(selectedStartValue);
    dataKeyUnionSelectedValues.push(selectedEndValue);
    if (this.histogramParams.dataType === DataType.time) {
      xDomainExtent.push(new Date(d3.min(dataKeyUnionSelectedValues, (d: Date) => +d) - this.dataInterval));
      xDomainExtent.push(new Date(d3.max(dataKeyUnionSelectedValues, (d: Date) => +d) + this.dataInterval));
    } else {
      xDomainExtent.push(d3.min(dataKeyUnionSelectedValues, (d: number) => d) * 1 - this.dataInterval * this.yDimension);
      xDomainExtent.push(d3.max(dataKeyUnionSelectedValues, (d: number) => d) * 1 + this.dataInterval);
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
    this.xAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__only-axis')
      .attr('transform', 'translate(' + leftOffset + ',' + this.chartDimensions.height + ')')
      .call(chartAxes.xAxis);
    this.xTicksAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__ticks-axis')
      .attr('transform', 'translate(' + leftOffset + ',' + this.chartDimensions.height * this.histogramParams.xAxisPosition + ')')
      .call(chartAxes.xTicksAxis);
    this.xLabelsAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__labels-axis')
      .attr('transform', 'translate(' + leftOffset + ',' + this.chartDimensions.height * this.histogramParams.xAxisPosition + ')')
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

  protected addSelectionBrush(chartAxes: ChartAxes | SwimlaneAxes, leftOffset: number): void {
    this.selectionBrush = d3.brushX().extent([[chartAxes.stepWidth * this.yDimension, 0],
    [(this.chartDimensions).width - leftOffset, (this.chartDimensions).height]]);
    const selectionBrushStart = Math.max(0, chartAxes.xDomain(this.selectionInterval.startvalue));
    const selectionBrushEnd = Math.min(chartAxes.xDomain(this.selectionInterval.endvalue), (this.chartDimensions).width);
    this.brushContext = this.context.append('g')
      .attr('class', 'brush')
      .attr('transform', 'translate(' + leftOffset + ', 0)')
      .style('visibility', 'visible')
      .style('pointer-events', 'visible')
      .call(this.selectionBrush);

    this.handleStartOfBrushingEvent(chartAxes);

    const brushResizePath = (d) => {
      const e = +(d.type === 'e'),
        x = e ? 1 : -1,
        y = this.brushHandlesHeight;
      return 'M' + (.5 * x) + ',' + y
        + 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6)
        + 'V' + (2 * y - 6) + 'A6,6 0 0 ' + e + ' ' + (.5 * x) + ',' + (2 * y)
        + 'Z'
        + 'M' + (2.5 * x) + ',' + (y + 8)
        + 'V' + (2 * y - 8)
        + 'M' + (4.5 * x) + ',' + (y + 8)
        + 'V' + (2 * y - 8);
    };

    this.brushHandles = this.brushContext.selectAll('.histogram__brush--handles')
      .data([{ type: 'w' }, { type: 'e' }])
      .enter().append('path')
      .attr('class', 'histogram__brush--handles')
      .attr('stroke', '#000')
      .attr('cursor', 'ew-resize')
      .style('z-index', '30000')
      .attr('d', brushResizePath);

    this.brushContext.call((this.selectionBrush).move, [selectionBrushStart, selectionBrushEnd]);
    this.handleOnBrushingEvent(chartAxes);
    this.handleEndOfBrushingEvent(chartAxes);
  }

  protected applyStyleOnSelectedBars(barsContext: any): void {
    barsContext.filter((d) => this.selectedBars.has(+d.key)).attr('class', 'histogram__chart--bar__fullyselected');

    barsContext.filter((d) => +d.key >= this.selectionInterval.startvalue
      && +d.key + this.histogramParams.barWeight * this.dataInterval <= this.selectionInterval.endvalue)
      .attr('class', 'histogram__chart--bar__currentselection');

    barsContext.filter((d) => (+d.key < this.selectionInterval.startvalue || +d.key > this.selectionInterval.endvalue)
      && (!this.selectedBars.has(+d.key)))
      .attr('class', 'histogram__chart--bar');

    barsContext.filter((d) => +d.key < this.selectionInterval.startvalue && (!this.selectedBars.has(+d.key))
      && +d.key + this.histogramParams.barWeight * this.dataInterval > this.selectionInterval.startvalue)
      .attr('class', 'histogram__chart--bar__partlyselected');

    barsContext.filter((d) => +d.key <= this.selectionInterval.endvalue && (!this.selectedBars.has(+d.key))
      && +d.key + this.histogramParams.barWeight * this.dataInterval > this.selectionInterval.endvalue)
      .attr('class', 'histogram__chart--bar__partlyselected');
  }

  protected plotBars(data: Array<HistogramData>, axes: ChartAxes | SwimlaneAxes, xDataDomain: any): void {
    this.barsContext = this.context.append('g').attr('class', 'histogram__bars').selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'histogram__chart--bar')
      .attr('x', function (d) { return xDataDomain(d.key); })
      .attr('width', axes.stepWidth * this.histogramParams.barWeight);
  }

  protected onSelectionDoubleClick(axes: ChartAxes | SwimlaneAxes) {
    this.brushContext.on('dblclick', () => {
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
      if (finalPosition.toString() !== 'NaN') {
        this.histogramParams.intervalSelectedMap.set(guid,
          {
            values: { startvalue: this.selectionInterval.startvalue, endvalue: this.selectionInterval.endvalue },
            x_position: finalPosition
          });
        if (this.histogramParams.selectionListIntervalId.indexOf(guid) < 0) {
          this.histogramParams.selectionListIntervalId.push(guid);
        }
      }
    });
  }

  protected resizeSelectedIntervals(chartAxes: ChartAxes | SwimlaneAxes) {
    this.histogramParams.intervalSelectedMap.forEach((k, v) => {
      const finalPosition = this.getIntervalMiddlePositon(chartAxes, +k.values.startvalue, +k.values.endvalue);
      this.histogramParams.intervalSelectedMap.set(v, {
        values: { startvalue: k.values.startvalue, endvalue: k.values.endvalue },
        x_position: finalPosition
      });
    });
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
    this.histogramParams.brushLeftTooltip.xPosition =  - this.chartDimensions.height + this.histogramParams.margin.left + leftPosition;
    this.histogramParams.brushRightTooltip.xPosition = this.histogramParams.margin.left  + rightPosition;
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
        const isoInterval = Math.max(Math.abs(+data[0].key - +this.selectionInterval.startvalue),
        Math.abs(+data[0].key - +this.selectionInterval.endvalue));
        interval = Math.min(1, isoInterval);
      } else {
        interval = Math.min(1, Math.abs(+data[0].key - +this.selectionInterval.startvalue),
        Math.abs(+data[0].key - +this.selectionInterval.endvalue));
      }
    }
    return interval;
  }

  protected abstract applyStyleOnSelection();
  protected abstract setDataInterval(data: Array<HistogramData> | Map<string, Array<HistogramData>>): void;
  protected abstract getDataInterval(data: Array<HistogramData> | Map<string, Array<HistogramData>>): number;

  protected abstract getAxes(): ChartAxes | SwimlaneAxes;
  protected abstract getSelectedBars(startvalue: number, endvalue: number): Array<number>;
  protected abstract getIntervalMiddlePositon(chartAxes: ChartAxes | SwimlaneAxes, startvalue: number, endvalue: number): number;

  private translateBrushHandles(selection: any, chartAxes: ChartAxes | SwimlaneAxes) {
    const xTranslation = this.brushHandlesHeight - (this.chartDimensions.height - this.brushHandlesHeight) / 2;
    if (selection !== null) {
      const sx = selection.map(chartAxes.xDomain.invert);
      this.brushHandles.attr('display', null).attr('transform', function (d, i) {
        return 'translate(' + [selection[i], -xTranslation] + ')';
      });
    } else {
      this.brushHandles.attr('display', 'none');
    }
  }

  private handleStartOfBrushingEvent(chartAxes: ChartAxes | SwimlaneAxes): void {
    if (this.histogramParams.brushHandlesHeightWeight <= 1 && this.histogramParams.brushHandlesHeightWeight > 0) {
      this.brushHandlesHeight = this.chartDimensions.height * this.histogramParams.brushHandlesHeightWeight;
    } else {
      this.brushHandlesHeight = this.chartDimensions.height;
    }
    this.selectionBrush.on('start', () => {
      const selection = d3.event.selection;
      this.isBrushed = false;
      this.translateBrushHandles(selection, chartAxes);
    });
  }

  private handleOnBrushingEvent(chartAxes: ChartAxes | SwimlaneAxes): void {
    this.selectionBrush.on('brush', (datum: any, index: number) => {
      this.isBrushing = true;
      const selection = d3.event.selection;
      if (selection !== null) {
        this.selectionInterval.startvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0];
        this.selectionInterval.endvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1];
        const dataInterval = this.getDataInterval(this.histogramParams.data);
        this.histogramParams.startValue = HistogramUtils.toString(this.selectionInterval.startvalue,
          this.histogramParams.chartType,
          this.histogramParams.dataType, this.histogramParams.valuesDateFormat, dataInterval);
        this.histogramParams.endValue = HistogramUtils.toString(this.selectionInterval.endvalue, this.histogramParams.chartType,
          this.histogramParams.dataType, this.histogramParams.valuesDateFormat, dataInterval);
        this.histogramParams.showTitle = false;
        this.setBrushTooltipsPositions();
        this.applyStyleOnSelection();
        this.translateBrushHandles(selection, chartAxes);
      }
    });
  }

  private handleEndOfBrushingEvent(chartAxes: ChartAxes | SwimlaneAxes): void {
    this.selectionBrush.on('end', (datum: any, index: number) => {
      const selection = d3.event.selection;
      if (selection !== null) {
        if (!this.fromSetInterval && this.isBrushing) {
          this.selectionInterval.startvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0];
          this.selectionInterval.endvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1];
          const dataInterval = this.getDataInterval(this.histogramParams.data);

          this.histogramParams.startValue = HistogramUtils.toString(this.selectionInterval.startvalue, this.histogramParams.chartType,
            this.histogramParams.dataType, this.histogramParams.valuesDateFormat, dataInterval);
          this.histogramParams.endValue = HistogramUtils.toString(this.selectionInterval.endvalue, this.histogramParams.chartType,
            this.histogramParams.dataType, this.histogramParams.valuesDateFormat, dataInterval);
          const selectionListInterval = [];
          this.histogramParams.intervalSelectedMap.forEach((k, v) => selectionListInterval.push(k.values));
          this.histogramParams.valuesListChangedEvent.next(selectionListInterval.concat(this.selectionInterval));

          const isSelectionBeyondDataDomain = HistogramUtils.isSelectionBeyondDataDomain(this.selectionInterval, this.dataDomain,
            this.histogramParams.intervalSelectedMap);
          if (!isSelectionBeyondDataDomain && this.hasSelectionExceededData) {
            this.plot(this.histogramParams.data);
            this.hasSelectionExceededData = false;
          }
        }
        this.histogramParams.showTitle = true;
        this.isBrushing = false;
        this.isBrushed = true;
      } else {
        this.translateBrushHandles(null, chartAxes);
      }
    });
  }

  private checkSelectedValuesValidity(selectedInputValues: SelectedInputValues) {
    if (selectedInputValues.startvalue > selectedInputValues.endvalue) {
      throw new Error('Start value is higher than end value');
    }
    if (selectedInputValues.startvalue === null && selectedInputValues.endvalue === null) {
      throw new Error('Start and end values are null');
    }
  }

}
