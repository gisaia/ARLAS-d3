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

import { AbstractChart } from './AbstractChart';
import {
  ChartAxes,
  HistogramData,
  HistogramUtils
} from '../utils/HistogramUtils';
import { curveLinear, CurveFactory, curveMonotoneX, area } from 'd3-shape';
import { min, max } from 'd3-array';
import { SelectionType } from '../HistogramParams';

export class ChartArea extends AbstractChart {

  public plot(inputData: Array<HistogramData>) {
    super.plot(inputData);
  }

  public resize(histogramContainer: HTMLElement): void {
    super.resize(histogramContainer);
    this.plot(this.histogramParams.histogramData);
    if (this.histogramParams.multiselectable) {
      this.resizeSelectedIntervals(this.chartAxes);
    }
  }

  protected moveDataByHalfInterval(data: Array<HistogramData>): Array<HistogramData> {
    const movedData: HistogramData[] = [];
    if (this.histogramParams.moveDataByHalfInterval) {
      const dataInterval = this.getDataInterval(data);
      data.forEach(d => {
        movedData.push({ key: +d.key + dataInterval / 2, value: d.value, chartId: d.chartId });
      });
      return movedData;
    } else {
      return data;
    }
  }

  protected plotChart(data: Array<HistogramData>): void {
    this.createClipperContext();

    const minimum = min(data, (d: HistogramData) => this.isValueValid(d) ? d.value : Number.MAX_VALUE);
    const maximum = max(data, (d: HistogramData) => this.isValueValid(d) ? d.value : Number.MIN_VALUE);
    const minOffset = this.histogramParams.showStripes ? 0 : 0.1 * (maximum - minimum);
    const maxOffset = 0.05 * (maximum - minimum);
    let areaYPositon = this.chartDimensions.height;
    if (this.yStartsFromMin && this.histogramParams.showStripes) {
      areaYPositon = 0.9 * this.chartDimensions.height;
    } else {
      if (this.yStartsFromMin) {
        if (minimum >= 0) {
          areaYPositon = this.chartAxes.yDomain(minimum - minOffset);
        } else {
          /** the maximum is also negative, otherwise yStartsFromMin is neceserrali false */
          areaYPositon = this.chartAxes.yDomain(maximum + maxOffset);
        }
      } else {
        areaYPositon = this.chartAxes.yDomain(0);
      }
    }

    const curveType: CurveFactory = (this.histogramParams.isSmoothedCurve) ? curveMonotoneX : curveLinear;
    const a = area<HistogramData>()
      .curve(curveType)
      .x(d => this.chartAxes.xDataDomain((+d.key).toString()))
      .y0(areaYPositon)
      .y1(d => this.chartAxes.yDomain(d.value));

    const urlFixedSelection = 'url(#' + this.histogramParams.uid + ')';
    const urlCurrentSelection = 'url(#' + this.histogramParams.uid + '-cs-area)';

    // CODE FROM ChartCurve
    const chartIdToData = new Map<string, HistogramData[]>();
    // Reduce data by charId
    const chartIds = new Set(data.map(item => item.chartId));
    // Put each data by chartId in a map
    chartIds.forEach(id => chartIdToData.set(id, data.filter(d => d.chartId === id)));
    // If the map is empty, add a default key with the unique chart data
    if (chartIdToData.size === 0) {
      chartIdToData.set('default', data);
    }

    chartIdToData.forEach(part => {
      const discontinuedData = HistogramUtils.splitData(part);

      discontinuedData[0].forEach(chartData => {
        this.context.append('g').attr('class', 'histogram__area-data')
          .append('path')
          .datum(chartData)
          .attr('class', 'histogram__chart--unselected--area')
          .style('opacity', 0.3)
          .attr('d', a);
        this.context.append('g').attr('class', 'histogram__area-data')
          .attr('clip-path', urlFixedSelection)
          .append('path')
          .datum(chartData)
          .attr('class', 'histogram__chart--fixed-selected--area')
          .style('opacity', 0.3)
          .attr('d', a);
        this.context.append('g').attr('class', 'histogram__area-data')
          .attr('clip-path', urlCurrentSelection)
          .append('path')
          .datum(chartData)
          .attr('class', 'histogram__chart--current-selected--area')
          .style('opacity', 0.3)
          .attr('d', a);

        // ADD STRIPPED AREAS
        if (this.yStartsFromMin && this.histogramParams.showStripes) {
          const id = this.histogramParams.uid;
          this.addStrippedPattern('unselected-area-' + id, this.START_Y_FROM_MIN_STRIPES_PATTERN, this.START_Y_FROM_MIN_STRIPES_SIZE,
            'histogram__stripped-unselected-area');
          this.addStrippedPattern('fixed-area-' + id, this.START_Y_FROM_MIN_STRIPES_PATTERN, this.START_Y_FROM_MIN_STRIPES_SIZE,
            'histogram__stripped-fixed-selected-area');
          this.addStrippedPattern('current-area-' + id, this.START_Y_FROM_MIN_STRIPES_PATTERN, this.START_Y_FROM_MIN_STRIPES_SIZE,
            'histogram__stripped-current-selected-area');
          this.context.append('g')
            .append('rect')
            .attr('x', this.chartAxes.xDomain(+chartData[0].key))
            .attr('y', this.chartDimensions.height * 0.9)
            .attr('width', this.chartAxes.xDomain(+chartData[chartData.length - 1].key) - this.chartAxes.xDomain(+chartData[0].key))
            .attr('height', this.chartDimensions.height * 0.1)
            .attr('fill', 'url(#unselected-area-' + id + ')');
          this.context.append('g')
            .append('rect').attr('clip-path', urlFixedSelection)
            .attr('x', this.chartAxes.xDomain(+chartData[0].key))
            .attr('y', this.chartDimensions.height * 0.9)
            .attr('width', this.chartAxes.xDomain(+chartData[chartData.length - 1].key) - this.chartAxes.xDomain(+chartData[0].key))
            .attr('height', this.chartDimensions.height * 0.1)
            .attr('fill', 'url(#fixed-area-' + id + ')');
          this.context.append('g')
            .append('rect').attr('clip-path', urlCurrentSelection)
            .attr('x', this.chartAxes.xDomain(+chartData[0].key))
            .attr('y', this.chartDimensions.height * 0.9)
            .attr('width', this.chartAxes.xDomain(+chartData[chartData.length - 1].key) - this.chartAxes.xDomain(+chartData[0].key))
            .attr('height', this.chartDimensions.height * 0.1)
            .attr('fill', 'url(#current-area-' + id + ')');
        }
        this.addStrippedPattern('no-data-stripes', this.NO_DATA_STRIPES_PATTERN, this.NO_DATA_STRIPES_SIZE, 'histogram__no-data-stripes');
        discontinuedData[1].forEach(part => {
          this.context.append('g')
            .append('rect')
            .attr('x', this.chartAxes.xDomain(+part[0].key))
            .attr('y', 0)
            .attr('width', this.chartAxes.xDomain(+part[part.length - 1].key) - this.chartAxes.xDomain(+part[0].key))
            .attr('height', this.chartDimensions.height)
            .attr('fill', 'url(#no-data-stripes)')
            .attr('fill-opacity', 0.5);
        });
      });
    });
  }

  protected drawChartAxes(chartAxes: ChartAxes, leftOffset: number): void {
    super.drawChartAxes(chartAxes, leftOffset);
    this.drawYAxis(chartAxes);
  }

  protected onSelectionClick(): void {
    this.brush.brushContext.on('click', () => {
      if (!this.brush.isBrushed && this.rectangleCurrentClipper !== null) {
        this.rectangleCurrentClipper.remove();
        this.rectangleCurrentClipper = null;
      }
    });
  }

  protected getIntervalMiddlePositon(chartAxes: ChartAxes, startvalue: number, endvalue: number): number {
    return this.histogramParams.margin.left + chartAxes.xDomain(startvalue) +
      1 / 2 * (chartAxes.xDomain(endvalue) - chartAxes.xDomain(startvalue)) - 24 / 2;
  }

  protected updateSelectionStyle(id: string): void { }

  protected addSelectionBrush(selectionType: SelectionType, chartAxes: ChartAxes, leftOffset: number): void {
    super.addSelectionBrush(selectionType, chartAxes, leftOffset);
    this.applyStyleOnSelection();
    this.onSelectionClick();
    if (this.histogramParams.multiselectable) {
      this.onSelectionDoubleClick(chartAxes);
    }
  }

  protected applyStyleOnSelection(): void {
    this.applyStyleOnClipper();
  }

  protected getStartPosition(data: Array<HistogramData>, index: number): number {
    return this.chartAxes.xDomain(data[index].key) - 10;
  }

  protected getEndPosition(data: Array<HistogramData>, index: number): number {
    return this.chartAxes.xDomain(data[index].key) + 10;
  }

  /**
   * Draws a indicator behind the hovered bucket of the histogram. This has as objective to highlight it on the histogram
   * @override For areas charts, a verticcal grey line is drawn + a circle on the bucket
   * @param data
   * @param axes
   */
  protected drawTooltipCursor(data: Array<HistogramData>, axes: ChartAxes, chartIsToSides?: Map<string, string>) {
    this.tooltipCursorContext.selectAll('.bar')
      .data(data.filter(d => this.isValueValid(d)))
      .enter().append('line')
      .attr('x1', (d) => axes.xDataDomain((+d.key).toString()))
      .attr('x2', (d) => axes.xDataDomain((+d.key).toString()))
      .attr('y1', 1)
      .attr('y2', () => this.chartDimensions.height)
      .attr('class', 'histogram__tooltip_cursor_line');
    this.context.append('g').attr('class', 'histogram__area_circle_container').selectAll('dot')
      .data(data.filter(d => this.isValueValid(d)))
      .enter().append('circle')
      .attr('r', () => 3)
      .attr('cx', (d) => axes.xDataDomain((+d.key).toString()))
      .attr('cy', (d) => axes.yDomain(d.value))
      .attr('class', 'histogram__area_circle')
      .style('opacity', '0.8');
  }

  /**
   * @override For areas charts, removes the line behind the hovered bucket of the histogram + removes the circle on the hovered bucket
   */
  protected clearTooltipCursor(): void {
    this.tooltipCursorContext.selectAll('line').remove();
    this.context.selectAll('g.histogram__area_circle_container').remove();
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

  private createClipperContext() {
    if (!this.checkDomainInitialized()) {
      return;
    }

    this.clipPathContext = this.context.append('defs').append('clipPath')
      .attr('id', this.histogramParams.uid);
    this.currentClipPathContext = this.context.append('defs').append('clipPath')
      .attr('id', this.histogramParams.uid + '-cs-area');
    this.rectangleCurrentClipper = this.currentClipPathContext.append('rect')
      .attr('id', 'clip-rect')
      .attr('x', this.chartAxes.xDomain(this.selectionInterval.startvalue))
      .attr('y', '0')
      .attr('width', this.chartAxes.xDomain(this.selectionInterval.endvalue) - this.chartAxes.xDomain(this.selectionInterval.startvalue))
      .attr('height', this.chartDimensions.height);
  }
}


