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

import { HistogramData, ChartAxes, DataType, Position, tickNumberFormat,
  getBarOptions, UNSELECTED_BARS, UNSELECTED_BARS_ZONE, SELECTED_BARS_ZONE, } from '../utils/HistogramUtils';
import { AbstractChart } from './AbstractChart';
import { scaleBand } from 'd3-scale';
import { axisBottom } from 'd3-axis';
import { utcFormat, timeFormat } from 'd3-time-format';
import { max, min } from 'd3-array';

export class ChartBars extends AbstractChart {

  private strippedBarsContext;
  private headBandsContext;

  private minimumData = Number.MAX_VALUE;
  private maximumData = Number.MIN_VALUE;
  private minOffset = 0;
  private maxOffset = 0;
  public plot(inputData: Array<HistogramData>) {
    super.plot(inputData);
  }

  public resize(histogramContainer: HTMLElement): void {
    super.resize(histogramContainer);
    this.plot(<Array<HistogramData>>this.histogramParams.histogramData);
    if (this.histogramParams.multiselectable) {
      this.resizeSelectedIntervals(this.chartAxes);
    }
  }

  /** Plots headbands on the top of each bar. A headband is small rectangle (that forms a band)
   * on top of each bar. Those headbands are added for styling purposes */
  protected plotHeadBand(data: Array<HistogramData>, axes: ChartAxes, xDataDomain: any, barWeight?: number) {
    const barWidth = barWeight ? axes.stepWidth * barWeight : axes.stepWidth * this.histogramParams.barWeight;
    this.headBandsContext = this.context.append('g').attr('class', 'bars_head_bands').selectAll('.bar')
      .data(data.filter(d => this.isValueValid(d)))
      .enter().append('rect')
      .attr('class', 'head_band')
      .attr('x', function (d) { return xDataDomain(d.key); })
      .attr('width', barWidth)
      .attr('y', (d) =>  {
        if (d.value > 0) {
          return axes.yDomain(d.value) - 1.5;
        } else if (d.value < 0) {
          return axes.yDomain(d.value) + 1.5;
        } else {
           return axes.yDomain.domain()[1] > 0 ? axes.yDomain(d.value) - 1.5 : axes.yDomain(d.value) + 1.5;
        }
      });
      // 1.5px is to avoid the headband to be under or above the x axis
  }

  /** Plots 3 rectangles behind data bars and selection brush. This rectangles are clippable in order to make a specific style for
   * - non selected parts of the chart
   * - current selected part
   * - already selected parts
   */
  protected plotBackground() {
    this.clipPathContext = this.context.append('defs').append('clipPath').attr('id', this.histogramParams.uid);
    this.currentClipPathContext = this.context.append('defs').append('clipPath').attr('id', this.histogramParams.uid + '-cs');
    this.rectangleCurrentClipper = this.currentClipPathContext.append('rect')
      .attr('id', 'clip-rect')
      .attr('x', this.chartAxes.xDomain(this.selectionInterval.startvalue))
      .attr('y', '0')
      .attr('width', this.chartAxes.xDomain(this.selectionInterval.endvalue) - this.chartAxes.xDomain(this.selectionInterval.startvalue))
      .attr('height', this.chartDimensions.height );
    const urlFixedSelection = 'url(#' + this.histogramParams.uid + ')';
    const urlCurrentSelection = 'url(#' + this.histogramParams.uid + '-cs)';
    const barOptions = getBarOptions(this.histogramParams.barOptions);
    this.context.append('g').append('rect')
      .attr('class', UNSELECTED_BARS_ZONE)
      .attr('x', 0)
      .attr('width', this.chartDimensions.width)
      .attr('y', 0)
      .attr('height', this.chartDimensions.height)
      .attr('fill', barOptions.unselected_style.background_color)
      .attr('fill-opacity', barOptions.unselected_style.background_opacity);
    this.context.append('g').attr('clip-path', urlCurrentSelection).append('rect')
      .attr('class', SELECTED_BARS_ZONE)
      .attr('x', 0)
      .attr('width', this.chartDimensions.width)
      .attr('y', 0)
      .attr('height', this.chartDimensions.height)
      .attr('fill', barOptions.selected_style.background_color)
      .attr('fill-opacity', barOptions.selected_style.background_opacity);
    this.context.append('g').attr('clip-path', urlFixedSelection).append('rect')
      .attr('class', SELECTED_BARS_ZONE)
      .attr('x', 0)
      .attr('width', this.chartDimensions.width)
      .attr('y', 0)
      .attr('height', this.chartDimensions.height)
      .attr('fill', barOptions.selected_style.background_color)
      .attr('fill-opacity', barOptions.selected_style.background_opacity);
  }

  protected plotChart(data: Array<HistogramData>): void {
    this.plotBackground();
    this.plotBars(data, this.chartAxes, this.chartAxes.xDataDomain);
    // todo stripes
    const minimum = min(data, (d: HistogramData) => this.isValueValid(d) ? d.value : Number.MAX_VALUE);
    const maximum = max(data, (d: HistogramData) => this.isValueValid(d) ? d.value : Number.MIN_VALUE);
    const minOffset = this.histogramParams.showStripes ? 0 : 0.1 * (maximum - minimum);
    const maxOffset = 0.05 * (maximum - minimum);

    this.maximumData = maximum;
    this.minimumData = minimum;
    this.maxOffset = maxOffset;
    this.minOffset = minOffset;

    let barsHeight = this.chartDimensions.height;
    if (this.yStartsFromMin && this.histogramParams.showStripes) {
      barsHeight = 0.9 * this.chartDimensions.height;
    } else {
      if (this.yStartsFromMin) {
        if (minimum >= 0 ) {
          barsHeight = this.chartAxes.yDomain(minimum - minOffset);
        } else {
          /** the maximum is also negative, otherwise yStartsFromMin is neceserrali false */
          barsHeight = this.chartAxes.yDomain(maximum + maxOffset);
        }
      } else {
        barsHeight = this.chartAxes.yDomain(0);
      }
    }
    this.barsContext
      .attr('y', (d) =>  {
        if (d.value >= 0) {
          return this.chartAxes.yDomain(d.value);
        } else {
          if (this.yStartsFromMin) {
            return this.chartAxes.yDomain(maximum + maxOffset) + 1;
          } else {
            return this.chartAxes.yDomain(0) + 1;
          }
        }
      })
      .attr('height', (d) => Math.abs(barsHeight - this.chartAxes.yDomain(d.value)));

    this.addStrippedPattern('no-data-stripes', this.NO_DATA_STRIPES_PATTERN, this.NO_DATA_STRIPES_SIZE, 'histogram__no-data-stripes');

    this.noDatabarsContext
      .attr('y', 0)
      .attr('height', (d) => this.chartDimensions.height)
      .attr('fill', 'url(#no-data-stripes)')
      .attr('fill-opacity', 0.5);
    // ADD STRIPPED BARS
    if (this.yStartsFromMin && this.histogramParams.showStripes) {
      const id = this.histogramParams.uid;
      this.addStrippedPattern('unselected-bars-' + id, this.START_Y_FROM_MIN_STRIPES_PATTERN, this.START_Y_FROM_MIN_STRIPES_SIZE,
        'histogram__stripped-unselected-bar');
      this.addStrippedPattern('partly-selected-bars-' + id, this.START_Y_FROM_MIN_STRIPES_PATTERN, this.START_Y_FROM_MIN_STRIPES_SIZE,
        'histogram__stripped-partlyselected-bar');
      this.addStrippedPattern('current-selected-bars-' + id, this.START_Y_FROM_MIN_STRIPES_PATTERN, this.START_Y_FROM_MIN_STRIPES_SIZE,
        'histogram__stripped-currentselected-bar');
      this.addStrippedPattern('fully-selected-bars-' + id, this.START_Y_FROM_MIN_STRIPES_PATTERN, this.START_Y_FROM_MIN_STRIPES_SIZE,
        'histogram__stripped-fullyselected-bar');
      this.strippedBarsContext = this.context.append('g').attr('class', 'histogram__bars').selectAll('.bar')
        .data(data.filter(d => this.isValueValid(d)))
        .enter().append('rect')
        .attr('class', UNSELECTED_BARS)
        .attr('x', (d) => this.chartAxes.xDataDomain(d.key))
        .attr('width', this.chartAxes.stepWidth * this.histogramParams.barWeight)
        .attr('y', (d) => 0.9 * this.chartDimensions.height)
        .attr('height', (d) => 0.1 * this.chartDimensions.height);
    }
    this.plotHeadBand(data, this.chartAxes, this.chartAxes.xDataDomain);
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
    this.chartAxes.xDataDomain = scaleBand().range([startRange, endRange]).paddingInner(0);
    this.chartAxes.xDataDomain.domain(data.map((d) => d.key));
    const ticksPeriod = Math.max(1, Math.round(data.length / this.histogramParams.xTicks));
    const labelsPeriod = Math.max(1, Math.round(data.length / this.histogramParams.xLabels));
    const labelPadding = (this.histogramParams.xAxisPosition === Position.bottom) ? 9 : -15;
    if (this.histogramParams.dataType === DataType.numeric) {
      this.chartAxes.xTicksAxis = axisBottom(this.chartAxes.xDomain).tickValues(this.chartAxes.xDataDomain.domain()
        .filter((d, i) => !(i % ticksPeriod))).tickSize(this.minusSign * 4);
      this.chartAxes.xLabelsAxis = axisBottom(this.chartAxes.xDomain).tickSize(0).tickPadding(labelPadding)
        .tickValues(this.chartAxes.xDataDomain.domain().filter((d, i) => !(i % labelsPeriod)))
        .tickFormat(d => tickNumberFormat(d, this.histogramParams.numberFormatChar));
      this.applyFormatOnXticks(data);
    } else {
      this.chartAxes.xTicksAxis = axisBottom(this.chartAxes.xDomain).ticks(this.histogramParams.xTicks).tickSize(this.minusSign * 4);
      this.chartAxes.xLabelsAxis = axisBottom(this.chartAxes.xDomain).tickSize(0).tickPadding(labelPadding)
        .ticks(this.histogramParams.xLabels);
      if (this.histogramParams.ticksDateFormat) {
        if (this.histogramParams.useUtc) {
          this.chartAxes.xLabelsAxis = this.chartAxes.xLabelsAxis.tickFormat(utcFormat(this.histogramParams.ticksDateFormat));
        } else {
          this.chartAxes.xLabelsAxis = this.chartAxes.xLabelsAxis.tickFormat(timeFormat(this.histogramParams.ticksDateFormat));
        }
      }
    }
    this.chartAxes.xAxis = axisBottom(this.chartAxes.xDomain).tickSize(0);
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

  protected applyStyleOnSelection(): void {
    this.applyStyleOnClipper();
    this.applyStyleOnSelectedBars(this.barsContext);
    if (this.yStartsFromMin && this.histogramParams.showStripes) {
      // APPLY STYLE ON STRIPPED BARS ACCORDING TO SELECTION TYPE : CURRENT, PARTLY, FULLY SELECTED BARS
      this.applyStyleOnStrippedSelectedBars(this.strippedBarsContext);
    }
    this.applyStyleOnHeadBand(this.headBandsContext);
  }

  /**
   * Draws a indicator behind the hovered bucket of the histogram. This has as objective to highlight it on the histogram
   * @override For bars charts, a grey rectangle is drawn behind the bucket
   * @param data
   * @param axes
   */
  protected drawTooltipCursor(data: Array<HistogramData>, axes: ChartAxes) {
    const barWidth = axes.stepWidth;
    const barsHeight = this.chartDimensions.height;
    this.tooltipCursorContext.selectAll('.bar')
      .data(data.filter(d => this.isValueValid(d)))
      .enter().append('rect')
      .attr('x', (d) => axes.xDataDomain(d.key))
      .attr('width', barWidth)
      .attr('y', 0)
      .attr('height', barsHeight)
      .attr('class', 'histogram__tooltip_cursor_rect');
  }

  /**
   * @override For bars charts, removes the rectangle behind the hovered bucket of the histogram
   */
  protected clearTooltipCursor(): void {
    this.tooltipCursorContext.selectAll('rect').remove();
  }

  protected applyStyleOnHeadBand(headBandContext: any): void {
    if (headBandContext) {
      if (this.histogramParams.barOptions) {
        const barsHeight = (this.yStartsFromMin && this.histogramParams.showStripes) ?
        (0.9 * this.chartDimensions.height) : this.chartDimensions.height;
        const barOptions = getBarOptions(this.histogramParams.barOptions);
        const selectedFill = barOptions.head_band.selected_style.fill;
        const selectedStroke = barOptions.head_band.selected_style.stroke;
        const selectedStrokeWidth = barOptions.head_band.selected_style.stroke_width;
        const unselectedFill = barOptions.head_band.unselected_style.fill;
        const unselectedStroke = barOptions.head_band.unselected_style.stroke;
        const unselectedStrokeWidth = barOptions.head_band.unselected_style.stroke_width;
        const selectedHeadBandHeight = getBarOptions(this.histogramParams.barOptions).head_band.selected_height;
        const unselectedHeadBandHeight = getBarOptions(this.histogramParams.barOptions).head_band.unselected_height;

        headBandContext.filter((d) => this.selectedBars.has(+d.key))
          .attr('fill', selectedFill)
          .attr('stroke', selectedStroke)
          .attr('stroke-width', selectedStrokeWidth)
          .attr('height', (d) => Math.min(selectedHeadBandHeight, barsHeight - this.chartAxes.yDomain(d.value)));

        headBandContext.filter((d) => +d.key >= this.selectionInterval.startvalue
        && +d.key + this.histogramParams.barWeight * this.dataInterval <= this.selectionInterval.endvalue)
          .attr('fill', selectedFill)
          .attr('stroke', selectedStroke)
          .attr('stroke-width', selectedStrokeWidth)
          .attr('height', (d) => Math.min(selectedHeadBandHeight, barsHeight - this.chartAxes.yDomain(d.value)));

        headBandContext.filter((d) => (+d.key < this.selectionInterval.startvalue || +d.key > this.selectionInterval.endvalue)
        && (!this.selectedBars.has(+d.key)))
          .attr('fill', unselectedFill)
          .attr('stroke', unselectedStroke)
          .attr('stroke-width', unselectedStrokeWidth)
          .attr('height', (d) => Math.min(unselectedHeadBandHeight, barsHeight - this.chartAxes.yDomain(d.value)));

        headBandContext.filter((d) => +d.key < this.selectionInterval.startvalue && (!this.selectedBars.has(+d.key))
        && +d.key + this.histogramParams.barWeight * this.dataInterval > this.selectionInterval.startvalue)
          .attr('fill', selectedFill)
          .attr('stroke', selectedStroke)
          .attr('stroke-width', selectedStrokeWidth)
          .attr('height', (d) => Math.min(selectedHeadBandHeight, barsHeight - this.chartAxes.yDomain(d.value)));

        headBandContext.filter((d) => +d.key <= this.selectionInterval.endvalue && (!this.selectedBars.has(+d.key))
        && +d.key + this.histogramParams.barWeight * this.dataInterval > this.selectionInterval.endvalue)
          .attr('fill', selectedFill)
          .attr('stroke', selectedStroke)
          .attr('stroke-width', selectedStrokeWidth)
          .attr('height', (d) => Math.min(selectedHeadBandHeight, barsHeight - this.chartAxes.yDomain(d.value)));
      } else {
        const maximum = max(this.histogramParams.histogramData, (d: HistogramData) => this.isValueValid(d) ? d.value : Number.MIN_VALUE);
        const minimum = min(this.histogramParams.histogramData, (d: HistogramData) => this.isValueValid(d) ? d.value : Number.MAX_VALUE);
        headBandContext.filter((d) => this.selectedBars.has(+d.key))
        .attr('class', (d => this.getHeadBandCssName('fullyselected', d, minimum, maximum)));

        headBandContext.filter((d) => +d.key >= this.selectionInterval.startvalue
        && +d.key + this.histogramParams.barWeight * this.dataInterval <= this.selectionInterval.endvalue)
          .attr('class', (d => this.getHeadBandCssName('currentselection', d, minimum, maximum)));

        headBandContext.filter((d) => (+d.key < this.selectionInterval.startvalue || +d.key > this.selectionInterval.endvalue)
        && (!this.selectedBars.has(+d.key)))
          .attr('class', (d => this.getHeadBandCssName('notselected', d, minimum, maximum)));

        headBandContext.filter((d) => +d.key < this.selectionInterval.startvalue && (!this.selectedBars.has(+d.key))
        && +d.key + this.histogramParams.barWeight * this.dataInterval > this.selectionInterval.startvalue)
          .attr('class', (d => this.getHeadBandCssName('partlyselected', d, minimum, maximum)));

        headBandContext.filter((d) => +d.key <= this.selectionInterval.endvalue && (!this.selectedBars.has(+d.key))
        && +d.key + this.histogramParams.barWeight * this.dataInterval > this.selectionInterval.endvalue)
          .attr('class', (d => this.getHeadBandCssName('partlyselected', d, minimum, maximum)));
      }
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

  private getHeadBandCssName(selectionType: string, d: HistogramData, minimum: number, maximum: number): string {
    const CSS_HEADBAND = 'headband_' + selectionType;
    if (minimum !== maximum) {
      if (d.value === minimum) {
        return CSS_HEADBAND + ' ' + CSS_HEADBAND + '_min';
      } else if (d.value === maximum) {
        return CSS_HEADBAND + ' ' + CSS_HEADBAND + '_max';
      }
    }
    return CSS_HEADBAND;
  }
}
