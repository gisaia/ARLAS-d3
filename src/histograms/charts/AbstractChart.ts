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
import {
  HistogramData, HistogramUtils, ChartAxes, DataType, SelectedInputValues, tickNumberFormat,
  formatNumber, getBarOptions, SelectedOutputValues,
  FULLY_SELECTED_BARS, CURRENTLY_SELECTED_BARS, UNSELECTED_BARS, PARTLY_SELECTED_BARS, roundToNearestMultiple
} from '../utils/HistogramUtils';
import { select, ContainerElement, mouse, event } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { min } from 'd3-array';
import { axisLeft } from 'd3-axis';
import { format } from 'd3-format';
import { brushX } from 'd3-brush';


export abstract class AbstractChart extends AbstractHistogram {

  protected chartAxes: ChartAxes;
  protected yStartsFromMin = false;
  protected START_Y_FROM_MIN_STRIPES_PATTERN = 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2';
  protected START_Y_FROM_MIN_STRIPES_SIZE = 4;
  protected NO_DATA_STRIPES_PATTERN = 'M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2';
  protected NO_DATA_STRIPES_SIZE = 10;

  protected clipPathContext;
  protected currentClipPathContext;
  protected rectangleCurrentClipper;
  protected selectedIntervals = new Map<string, { rect: any, startEndValues: SelectedOutputValues }>();

  public plot(inputData: Array<HistogramData>) {
    super.init();
    this.dataDomain = inputData;
    if (inputData !== null && Array.isArray(inputData) && inputData.length > 0) {
      const movedData = this.moveDataByHalfInterval(inputData);
      const data = HistogramUtils.parseDataKey(movedData, this.histogramParams.dataType);
      this.histogramParams.dataLength = data.length;
      const minMaxBorders = this.getHistogramMinMaxBorders(data);
      this.histogramParams.bucketRange = this.getDataInterval(data);
      this.histogramParams.bucketInterval = this.getbucketInterval(this.histogramParams.bucketRange, this.histogramParams.dataType);
      this.initializeDescriptionValues(minMaxBorders[0], minMaxBorders[1], this.histogramParams.bucketRange);
      this.initializeChartDimensions();
      this.customizeData(data);
      this.createChartAxes(data);
      this.drawChartAxes(this.chartAxes, 0);
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

  public setSelectedInterval(selectedInputValues: SelectedInputValues): void {
    const axes = this.getAxes();
    this.checkSelectedValuesValidity(selectedInputValues);
    this.fromSetInterval = true;
    const parsedSelectedValues = HistogramUtils.parseSelectedValues(selectedInputValues, this.histogramParams.dataType);
    if (parsedSelectedValues.startvalue !== this.selectionInterval.startvalue ||
      parsedSelectedValues.endvalue !== this.selectionInterval.endvalue) {
      this.selectionInterval.startvalue = parsedSelectedValues.startvalue;
      this.selectionInterval.endvalue = parsedSelectedValues.endvalue;
      const dataInterval = this.getDataInterval(<Array<HistogramData>>this.histogramParams.histogramData);
      this.histogramParams.startValue = HistogramUtils.toString(this.selectionInterval.startvalue, this.histogramParams, dataInterval);
      this.histogramParams.endValue = HistogramUtils.toString(this.selectionInterval.endvalue, this.histogramParams, dataInterval);
      const data = this.dataDomain;
      if (data !== null) {
        if (HistogramUtils.isSelectionBeyondDataDomain(selectedInputValues, <Array<{ key: number, value: number }>>data,
          this.histogramParams.intervalSelectedMap)) {
          this.hasSelectionExceededData = true;
          this.plot(<Array<{ key: number, value: number }>>this.histogramParams.histogramData);
        } else {
          if (this.hasSelectionExceededData) {
            this.hasSelectionExceededData = false;
            this.plot(<Array<{ key: number, value: number }>>this.histogramParams.histogramData);
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
    this.clearTooltipCursor();
    const index = this.histogramParams.selectionListIntervalId.indexOf(id, 0);
    if (index > -1) {
      this.histogramParams.selectionListIntervalId.splice(index, 1);
    }
    this.updateSelectionStyle(id);
    this.histogramParams.intervalSelectedMap.delete(id);
    const selectionListInterval = [];
    this.histogramParams.intervalSelectedMap.forEach((k, v) => selectionListInterval.push(k.values));
    this.histogramParams.valuesListChangedEvent.next(selectionListInterval.concat(this.selectionInterval));
    if (this.selectedIntervals && this.selectedIntervals.get(id)) {
      this.selectedIntervals.get(id).rect.remove();
      this.selectedIntervals.delete(id);
    }
    const isSelectionBeyondDataDomain = HistogramUtils.isSelectionBeyondDataDomain(this.selectionInterval, this.dataDomain,
      this.histogramParams.intervalSelectedMap);
    if (!isSelectionBeyondDataDomain && this.hasSelectionExceededData) {
      this.plot(<Array<HistogramData>>this.histogramParams.histogramData);
      this.hasSelectionExceededData = false;
    } else if (isSelectionBeyondDataDomain) {
      this.plot(<Array<HistogramData>>this.histogramParams.histogramData);
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
    this.clearTooltipCursor();
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
    this.selectedIntervals.forEach((rectClipper, guid) => { rectClipper.rect.remove(); });
    this.selectedIntervals.clear();
    this.histogramParams.intervalListSelection.forEach((v) => {
      if (this.histogramParams.dataType === DataType.time) {
        v.startvalue = new Date(+v.startvalue);
        v.endvalue = new Date(+v.endvalue);
      }
      const guid = HistogramUtils.getIntervalGUID(v.startvalue, v.endvalue);
      const rect = this.getAppendedRectangle(v.startvalue, v.endvalue);
      this.selectedIntervals.set(guid, { rect: rect, startEndValues: { startvalue: v.startvalue, endvalue: v.endvalue } });
    });
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

  protected onSelectionDoubleClick(axes: ChartAxes) {
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
        // ### Emits the selected interval
        const selectionListInterval = [];
        this.histogramParams.intervalSelectedMap.forEach((k, v) => selectionListInterval.push(k.values));
        this.histogramParams.valuesListChangedEvent.next(selectionListInterval.concat(this.selectionInterval));

        if (!this.selectedIntervals.has(guid)) {
          const rect = this.getAppendedRectangle(this.selectionInterval.startvalue, this.selectionInterval.endvalue);
          this.selectedIntervals.set(guid, {
            rect: rect, startEndValues: {
              startvalue: this.selectionInterval.startvalue,
              endvalue: this.selectionInterval.endvalue
            }
          });
        }
      } else {
        if (this.rectangleCurrentClipper !== null) {
          this.rectangleCurrentClipper.remove();
          this.rectangleCurrentClipper = null;
        }
      }
    });
  }

  protected resizeSelectedIntervals(chartAxes: ChartAxes) {
    this.histogramParams.intervalSelectedMap.forEach((k, v) => {
      const finalPosition = this.getIntervalMiddlePositon(chartAxes, +k.values.startvalue, +k.values.endvalue);
      this.histogramParams.intervalSelectedMap.set(v, {
        values: { startvalue: k.values.startvalue, endvalue: k.values.endvalue },
        x_position: finalPosition
      });
    });
    this.selectedIntervals.forEach((rect, guid) => {
      rect.rect.remove();
      const rectangle = this.getAppendedRectangle(rect.startEndValues.startvalue, rect.startEndValues.endvalue);
      this.selectedIntervals.set(guid, { rect: rectangle, startEndValues: rect.startEndValues });
    });
  }

  protected moveDataByHalfInterval(data: Array<HistogramData>): Array<HistogramData> {
    return data;
  }

  protected customizeData(data: Array<HistogramData>): void { }

  protected initializeChartDimensions(): void {
    super.initializeChartDimensions();
    if (this.histogramParams.dataLength > 1) {
      this.histogramParams.displaySvg = 'block';
    } else {
      this.histogramParams.displaySvg = 'none';
    }
    this.initializeChartHeight();
    const svg = select(this.histogramParams.svgNode);
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
    let yDomain = scaleLinear().range([this.chartDimensions.height, 0]);
    let maximum = max(data, (d: HistogramData) => this.isValueValid(d) ? d.value : Number.MIN_VALUE);
    const minimum = min(data, (d: HistogramData) => this.isValueValid(d) ? d.value : Number.MAX_VALUE);
    if (minimum === maximum) {
      maximum += 1;
    }
    let maxOffset = maximum * 0.05;
    const miniOffset = minimum * 0.05;
    const minYDomain = minimum > 0 ? 0 : minimum + miniOffset;
    const maxYDomain = maximum < 0 ? 0 : maximum + maxOffset;
    yDomain.domain([minYDomain, maxYDomain]);
    const yAllDomain = yDomain;
    /** if histogram y values are negative and positive, prohibit stripes */
    if (minimum < 0 && maximum > 0) {
      this.histogramParams.yAxisFromZero = true;
      this.yStartsFromMin = false;
    }
    // IF WE WANT TO START THE HISTOGRAM FROM MIN OF DATA INSTEAD OF 0
    if (!this.histogramParams.yAxisFromZero) {
      // FIRST WE CHECK IF THE MINIMUM OF DATA IS GREATER THAN 30% OF THE CHART HEIGHT
      // IF SO, THEN THE CHART WILL START FROM THE MINIMUM OF DATA INSTEAD OF 0
      if ((minimum >= 0 && this.chartDimensions.height - yDomain(minimum) >= 0.3 * this.chartDimensions.height)
        || (maximum <= 0 && this.chartDimensions.height - yDomain(maximum) >= 0.3 * this.chartDimensions.height)) {
        // THE `showStripes` OPTION DECIDES WETHER WE ADD STIPPED AREA/BARS TO THE HISTOGRAMS
        // IF `showStripes == TRUE` THEN STRIPES WILL OCCUPY 10% OF THE CHARTHEIGHT AND THE DATA VARIATION WILL OCCUPY 90% OF THE CHART
        // IF `showStripes == FALSE` THEN NO STRIPES WILL BE DISPLAYED. HOWEVER, THE CHART STARTS FROM MIN OF DATA - A DOMAINOFFSET
        const yMaxRange = this.histogramParams.showStripes ? (0.9 * this.chartDimensions.height) : this.chartDimensions.height;
        this.yStartsFromMin = true;
        yDomain = scaleLinear().range([yMaxRange, 0]);
        const minOffset = this.histogramParams.showStripes ? 0 : 0.1 * (maximum - minimum);
        maxOffset = 0.05 * (maximum - minimum);
        yDomain.domain([minimum - minOffset, maximum + maxOffset]);
      } else {
        this.yStartsFromMin = false;
      }
    }

    const yTicksAxis = axisLeft(yDomain).ticks(this.histogramParams.yTicks).tickSizeOuter(0);
    const yLabelsAxis = axisLeft(yDomain).tickSize(0).tickPadding(10).ticks(this.histogramParams.yLabels)
      .tickFormat(d => !this.histogramParams.shortYLabels ? tickNumberFormat(d, this.histogramParams.numberFormatChar) : format('~s')(d));
    const yAxis = axisLeft(yAllDomain).tickSize(0).ticks(0);
    this.chartAxes = { xDomain, xDataDomain, yDomain, xTicksAxis, yTicksAxis, stepWidth, xLabelsAxis, yLabelsAxis, xAxis, yAxis };
  }

  protected drawYAxis(chartAxes: ChartAxes, chartIdsToSide?: Map<string, string>, chartId?: string): void {
    // yTicksAxis and yLabelsAxis are translated of 1px to the left so that they are not hidden by the histogram
    let translate = 'translate(-1, 0)';
    let side;
    if (!!chartId && !!chartIdsToSide) {
      side = chartIdsToSide.get(chartId);
    }
    if (!side) {
      side = 'left';
    }
    if (side === 'right') {
      translate = 'translate('.concat((this.chartDimensions.width + 1).toString()).concat(', 0)');
    }
    let axisColor;
    if (!!chartId && !!this.histogramParams.colorGenerator) {
      axisColor = this.histogramParams.colorGenerator.getColor(chartId);
    }
    const yTicksAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__ticks-axis')
      .attr('transform', translate);

    const yLabelsAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__labels-axis')
      .attr('transform', translate);

    const yAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__only-axis')
      .attr('transform', translate);
    if (side === 'right') {
      yTicksAxis
        .attr('class', 'histogram__ticks-axis-right')
        .call(chartAxes.yTicksAxisRight);
      yLabelsAxis
        .attr('class', 'histogram__labels-axis-right')
        .call(chartAxes.yLabelsAxisRight);
      yAxis
        .attr('class', 'histogram__only-axis-right')
        .call(chartAxes.yAxisRight);
    } else {
      yTicksAxis.call(chartAxes.yTicksAxis);
      yLabelsAxis.call(chartAxes.yLabelsAxis);
      yAxis.call(chartAxes.yAxis);
    }

    // Define css classes for the ticks, labels and the axes
    yTicksAxis.selectAll('path').attr('class', 'histogram__axis');
    if (!!axisColor) {
      yAxis.selectAll('path').attr('stroke', axisColor).attr('stroke-width', '1.8px');
    } else {
      yAxis.selectAll('path').attr('class', 'line');
    }
    yTicksAxis.selectAll('line').attr('class', 'histogram__ticks');
    yLabelsAxis.selectAll('text').attr('class', 'histogram__labels');
    if (!this.histogramParams.showYTicks) {
      yTicksAxis.selectAll('g').attr('class', 'histogram__ticks-axis__hidden');
    }
    if (!this.histogramParams.showYLabels) {
      yLabelsAxis.attr('class', 'histogram__labels-axis__hidden');
    }

    if (this.histogramParams.showHorizontalLines && side === 'left') {
      const horizontalAxes = this.context.append('g')
        .attr('class', 'histogram__horizontal-axis')
        .call(this.chartAxes.yTicksAxis.tickSize(-this.chartDimensions.width));
      horizontalAxes.selectAll('line').attr('class', 'histogram__horizontal-axis__line');
      horizontalAxes.selectAll('text').attr('class', 'histogram__horizontal-axis__text');
    }
  }

  protected showTooltips(data: Array<HistogramData>, chartIsToSides?: Map<string, string>): void {
    if (this.histogramParams.dataUnit !== '') { this.histogramParams.dataUnit = '(' + this.histogramParams.dataUnit + ')'; }
    this.context
      .on('mousemove', () => {
        const previousHoveredBucketKey = this.hoveredBucketKey;
        this.hoveredBucketKey = null;
        this.setTooltipPositions(data, <ContainerElement>this.context.node(), chartIsToSides);
        if (this.hoveredBucketKey !== previousHoveredBucketKey && this.hoveredBucketKey !== null) {
          this.histogramParams.hoveredBucketEvent.next(this.hoveredBucketKey);
        }
      })
      .on('mouseout', () => this.histogramParams.tooltip.isShown = false);
  }


  /**
   * Draws a indicator behind the hovered bucket of the histogram. This has as objective to highlight it on the histogram
   * @param data
   * @param axes
   */
  protected drawTooltipCursor(data: Array<HistogramData>, axes: ChartAxes, chartIsToSides?: Map<string, string>): void { }

  protected setTooltipPositions(data: Array<HistogramData>, container: ContainerElement, chartIsToSides?: Map<string, string>): void {
    const xy = mouse(container);
    const xDomainValue = +this.chartAxes.xDomain.invert(xy[0]);
    const dataInterval = this.histogramParams.bucketRange;
    /** Get all buckets near xDomainValue */
    const bucketPixelSize = this.chartAxes.xDomain(xDomainValue) - this.chartAxes.xDomain(xDomainValue - dataInterval);
    let hoveredBuckets = [];
    if (bucketPixelSize < 1 /**px */) {
      /** in case 2 buckets are within a space that is less that 1 px, the cursor will not be able to detect all buckets
       * In order to fix this, we give the current cursor a buffer of 2px to the right and 2px to the left
       * and then we pick the closest key to the cursor
       * This will allow to have a tooltip for isolated points in a dense histogram
       */
      const chartIdDistanceToCursor = new Map<string, number>();
      data.forEach(b => {
        if (this.chartAxes.xDomain(b.key) - 2 /**px */ <= xy[0] && this.chartAxes.xDomain(b.key) + 2 /**px */ > xy[0]) {
          const distance = xDomainValue - +b.key;
          const existingDistance = chartIdDistanceToCursor.get(b.chartId);
          if ((!!b.chartId && existingDistance === undefined) ||
            (!!b.chartId && existingDistance !== undefined && distance < existingDistance)) {
            chartIdDistanceToCursor.set(b.chartId, distance);
          }
        }
      });
      hoveredBuckets = data.filter(b => {
        const distance = xDomainValue - +b.key;
        const cursorWellPositioned = this.chartAxes.xDomain(b.key) - 2 /**px */ <= xy[0]
          && this.chartAxes.xDomain(b.key) + 2 /**px */ > xy[0];
        const minimalDistance = chartIdDistanceToCursor.get(b.chartId) === distance;
        return cursorWellPositioned && minimalDistance;
      });
    } else {
      hoveredBuckets = data.filter(b => +b.key <= xDomainValue && +b.key > xDomainValue - dataInterval);
    }
    const ys = [];
    let x;
    hoveredBuckets.forEach(hb => {
      if (HistogramUtils.isValueValid(hb)) {
        let color;
        if (!!hb.chartId && !!this.histogramParams.colorGenerator) {
          color = this.histogramParams.colorGenerator.getColor(hb.chartId);
        }
        x = HistogramUtils.toString(hb.key, this.histogramParams, dataInterval),
        ys.push({
          value: formatNumber(hb.value, this.histogramParams.numberFormatChar),
          chartId: hb.chartId,
          color
        });

        this.clearTooltipCursor();
        this.drawTooltipCursor(hoveredBuckets, this.chartAxes, chartIsToSides);
      }
    });
    if (hoveredBuckets.length > 0) {
      this.histogramParams.tooltipEvent.next(
        {
          xValue: x,
          xRange: this.histogramParams.bucketInterval,
          dataType: (this.histogramParams.dataType === DataType.time ? 'time' : 'numeric'),
          y: ys,
          shown: true,
          xPosition: xy[0] + this.chartDimensions.margin.left,
          yPosition: xy[1],
          chartWidth: this.chartDimensions.width + this.chartDimensions.margin.left + this.chartDimensions.margin.right
        }
      );
    } else {
      this.clearTooltipCursor();
      this.histogramParams.tooltipEvent.next(
        {
          xValue: x,
          y: ys,
          shown: false,
          xPosition: xy[0] + this.chartDimensions.margin.left,
          yPosition: xy[1],
          chartWidth: this.chartDimensions.width + this.chartDimensions.margin.left + this.chartDimensions.margin.right
        }
      );
    }
  }

  protected getIntervalMiddlePositon(chartAxes: ChartAxes, startvalue: number, endvalue: number): number {
    const keys = this.getSelectedBars(startvalue, endvalue);
    return this.histogramParams.margin.left + chartAxes.xDomain(startvalue) + 1 / 2 *
      (chartAxes.xDomain(endvalue) - chartAxes.xDomain(startvalue)) - 24 / 2;
  }

  protected getSelectedBars(startvalue: number, endvalue: number): Array<number> {
    const keys = new Array<number>();
    const bars = HistogramUtils
      .parseDataKey(<Array<{ key: number; value: number }>>this.histogramParams.histogramData, this.histogramParams.dataType);
    bars.forEach((d) => {
      if (+d.key >= startvalue
        && +d.key + this.histogramParams.barWeight * this.dataInterval <= +endvalue) {
        this.selectedBars.add(+d.key);
        keys.push(+d.key);
      }
    });
    return keys;
  }

  protected addStrippedPattern(id: string, pattern: string, size: number, cssClass: string): void {
    this.context.append('defs')
      .append('pattern')
      .attr('id', id)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', size)
      .attr('height', size)
      .append('path')
      .attr('d', pattern)
      .attr('class', cssClass);
  }

  protected applyFormatOnXticks(data: Array<HistogramData>): void {
    const interval = this.getHistogramDataInterval(data);
    if (interval > 0 && interval < 1) {
      const roundPrecision = HistogramUtils.getRoundPrecision(interval);
      this.chartAxes.xLabelsAxis = this.chartAxes.xLabelsAxis.tickFormat(format('.' + roundPrecision + 'f'));
    }
  }

  protected setDataInterval(data: Array<HistogramData>): void {
    this.dataInterval = this.getDataInterval(data);
  }

  protected getDataInterval(data: Array<HistogramData>): number {
    return this.getHistogramDataInterval(data);
  }

  protected getbucketInterval(bucketRange: number, dataType: DataType): {
    value: number,
    unit?: string
  } {
    const DAY_IN_MILLISECOND = 86400000;
    const HOUR_IN_MILLISECOND = 3600000;
    const MINUTE_IN_MILLISECOND = 60000;
    const SECOND_IN_MILLISECOND = 1000;
    if (dataType === DataType.time) {
      let intervalValue = bucketRange / DAY_IN_MILLISECOND;
      if (intervalValue > 1) {
          if (intervalValue >= 1 && intervalValue <= 3) {
              /**Nb days between 1 and 3 => aggregation in hours (multiple of 24) */
              intervalValue = Math.round(bucketRange / HOUR_IN_MILLISECOND);
              intervalValue = roundToNearestMultiple(intervalValue, 24);
              return { value: intervalValue, unit: 'hour' + (intervalValue === 1 ? '' : 's') };
          } else if (intervalValue > 3 && intervalValue <= 15) {
              /**Nb days between 4 and 15 => aggregation in days */
              intervalValue = Math.round(intervalValue);
              return { value: intervalValue, unit: 'day' + (intervalValue === 1 ? '' : 's') };
          } else {
              /**Nb days greater than 15 => aggregation in days (multiple of 15) */
              intervalValue = Math.round(intervalValue);
              intervalValue = roundToNearestMultiple(intervalValue, 15);
              return { value: intervalValue, unit: 'day' + (intervalValue === 1 ? '' : 's') };
          }
      } else {
          intervalValue = bucketRange / HOUR_IN_MILLISECOND;
          if (intervalValue > 6 && intervalValue < 24) {
              /**Nb hours between 6 than 24 => aggregation in hours */
              intervalValue = Math.round(intervalValue);
              return { value: intervalValue, unit: 'hour' + (intervalValue === 1 ? '' : 's') };
          } else if (intervalValue > 1 && intervalValue <= 6) {
              /**Nb hours between 1 than 6 => aggregation in minutes (multiple of 60) */
              intervalValue = bucketRange / MINUTE_IN_MILLISECOND;
              intervalValue = Math.round(intervalValue);
              intervalValue = roundToNearestMultiple(intervalValue, 60);
              return { value: intervalValue / 60, unit: 'hour' + (intervalValue / 60 === 1 ? '' : 's') };
          } else {
              intervalValue = bucketRange / MINUTE_IN_MILLISECOND;
              /**Nb minutes between 5 than 60 => aggregation in minutes (multiple of 5) */
              if (intervalValue > 5) {
                  intervalValue = Math.round(intervalValue);
                  intervalValue = roundToNearestMultiple(intervalValue, 5);
                  if (intervalValue % 60 === 0 ) {
                    return { value: intervalValue / 60, unit: 'hour' + (intervalValue / 60 === 1 ? '' : 's') };
                  }
                  return { value: intervalValue, unit: 'minute' + (intervalValue === 1 ? '' : 's') };
              } else if (intervalValue > 1 && intervalValue < 5) {
                  /**Nb minutes less than 5 => aggregation in minutes */
                  intervalValue = Math.round(intervalValue);
                  return { value: intervalValue, unit: 'minute' + (intervalValue === 1 ? '' : 's') };
              } else {
                  /**Nb seconds less than or equal 60 => aggregation in seconds */
                  intervalValue = bucketRange / SECOND_IN_MILLISECOND;
                  intervalValue = Math.max(1, Math.round(intervalValue));
                  if (intervalValue % 60 === 0 ) {
                    return { value: intervalValue / 60, unit: 'minute' + (intervalValue / 60 === 1 ? '' : 's') };
                  }
                  return { value: intervalValue, unit: 'second' + (intervalValue === 1 ? '' : 's') };
              }
          }
      }
    } else {
      return { value: +HistogramUtils.toString(bucketRange, this.histogramParams, bucketRange)};
    }
  }

  protected getAxes() {
    return this.chartAxes;
  }

  protected addSelectionBrush(chartAxes: ChartAxes, leftOffset: number): void {
    this.selectionBrush = brushX().extent([[chartAxes.stepWidth / 5 * this.yDimension, 0],
    [(this.chartDimensions).width - leftOffset, (this.chartDimensions).height]]);
    const selectionBrushStart = Math.max(0, chartAxes.xDomain(this.selectionInterval.startvalue));
    const selectionBrushEnd = Math.min(chartAxes.xDomain(this.selectionInterval.endvalue), (this.chartDimensions).width);
    this.brushContext = this.context.append('g')
      .attr('class', 'brush')
      .attr('transform', 'translate(' + leftOffset + ', 0)')
      .style('pointer-events', 'visible')
      .call(this.selectionBrush);

    this.handleStartOfBrushingEvent(chartAxes);

    const brushResizePath = (d) => {
      return (d.type === 'e') ? 0 : -2.8;
    };

    this.brushHandles = this.brushContext.selectAll('.histogram__brush--handles')
      .data([{ type: 'w' }, { type: 'e' }])
      .enter().append('rect')
      .attr('stroke', '#5e5e5e')
      .attr('fill', '#5e5e5e')
      .attr('cursor', 'ew-resize')
      .style('z-index', '30000')
      .attr('width', 2.5)
      .attr('height', this.brushHandlesHeight)
      .attr('x', brushResizePath)
      .attr('y', this.brushHandlesHeight);

    this.brushContext.call((this.selectionBrush).move, [selectionBrushStart, selectionBrushEnd]);
    this.handleOnBrushingEvent(chartAxes);
    this.handleEndOfBrushingEvent(chartAxes);
  }

  protected applyStyleOnSelectedBars(barsContext: any): void {
    if (this.histogramParams.barOptions) {
      const barOptions = getBarOptions(this.histogramParams.barOptions);
      const selectedFill = barOptions.selected_style.fill;
      const selectedStroke = barOptions.selected_style.stroke;
      const selectedStrokeWidth = barOptions.selected_style.stroke_width;
      const unselectedFill = barOptions.unselected_style.fill;
      const unselectedStroke = barOptions.unselected_style.stroke;
      const unselectedStrokeWidth = barOptions.unselected_style.stroke_width;
      barsContext.filter((d) => this.selectedBars.has(+d.key))
        .attr('fill', selectedFill)
        .attr('stroke', selectedStroke)
        .attr('stroke-width', selectedStrokeWidth);

      barsContext.filter((d) => +d.key >= this.selectionInterval.startvalue
        && +d.key + this.histogramParams.barWeight * this.dataInterval <= this.selectionInterval.endvalue)
        .attr('fill', selectedFill)
        .attr('stroke', selectedStroke)
        .attr('stroke-width', selectedStrokeWidth);

      barsContext.filter((d) => (+d.key < this.selectionInterval.startvalue || +d.key > this.selectionInterval.endvalue)
        && (!this.selectedBars.has(+d.key)))
        .attr('fill', unselectedFill)
        .attr('stroke', unselectedStroke)
        .attr('stroke-width', unselectedStrokeWidth);

      barsContext.filter((d) => +d.key < this.selectionInterval.startvalue && (!this.selectedBars.has(+d.key))
        && +d.key + this.histogramParams.barWeight * this.dataInterval > this.selectionInterval.startvalue)
        .attr('fill', selectedFill)
        .attr('stroke', selectedStroke)
        .attr('stroke-width', selectedStrokeWidth);

      barsContext.filter((d) => +d.key <= this.selectionInterval.endvalue && (!this.selectedBars.has(+d.key))
        && +d.key + this.histogramParams.barWeight * this.dataInterval > this.selectionInterval.endvalue)
        .attr('fill', selectedFill)
        .attr('stroke', selectedStroke)
        .attr('stroke-width', selectedStrokeWidth);
    } else {
      barsContext.filter((d) => this.selectedBars.has(+d.key)).attr('class', FULLY_SELECTED_BARS);

      barsContext.filter((d) => +d.key >= this.selectionInterval.startvalue
        && +d.key + this.histogramParams.barWeight * this.dataInterval <= this.selectionInterval.endvalue)
        .attr('class', CURRENTLY_SELECTED_BARS);

      barsContext.filter((d) => (+d.key < this.selectionInterval.startvalue || +d.key > this.selectionInterval.endvalue)
        && (!this.selectedBars.has(+d.key)))
        .attr('class', UNSELECTED_BARS);

      barsContext.filter((d) => +d.key < this.selectionInterval.startvalue && (!this.selectedBars.has(+d.key))
        && +d.key + this.histogramParams.barWeight * this.dataInterval > this.selectionInterval.startvalue)
        .attr('class', PARTLY_SELECTED_BARS);

      barsContext.filter((d) => +d.key <= this.selectionInterval.endvalue && (!this.selectedBars.has(+d.key))
        && +d.key + this.histogramParams.barWeight * this.dataInterval > this.selectionInterval.endvalue)
        .attr('class', PARTLY_SELECTED_BARS);
    }
  }

  protected getAppendedRectangle(start: Date | number, end: Date | number): any {
    return this.clipPathContext.append('rect')
      .attr('id', 'clip-rect')
      .attr('x', this.chartAxes.xDomain(start))
      .attr('y', '0')
      .attr('width', this.chartAxes.xDomain(end) - this.chartAxes.xDomain(start))
      .attr('height', this.chartDimensions.height);
  }

  protected applyStyleOnClipper(): void {
    if (this.rectangleCurrentClipper === null) {
      this.rectangleCurrentClipper = this.currentClipPathContext.append('rect')
        .attr('id', 'clip-rect')
        .attr('x', this.chartAxes.xDomain(this.selectionInterval.startvalue))
        .attr('y', '0')
        .attr('width', this.chartAxes.xDomain(this.selectionInterval.endvalue) - this.chartAxes.xDomain(this.selectionInterval.startvalue))
        .attr('height', this.chartDimensions.height);
    } else {
      this.rectangleCurrentClipper
        .attr('x', this.chartAxes.xDomain(this.selectionInterval.startvalue))
        .attr('width', this.chartAxes.xDomain(this.selectionInterval.endvalue) - this.chartAxes.xDomain(this.selectionInterval.startvalue));
    }
  }

  protected abstract plotChart(data: Array<HistogramData>): void;
  protected abstract applyStyleOnSelection(): void;
  protected abstract getStartPosition(data: Array<HistogramData>, index: number): number;
  protected abstract getEndPosition(data: Array<HistogramData>, index: number): number;
  protected abstract setTooltipXposition(xPosition: number): number;
  protected abstract setTooltipYposition(yPosition: number): number;

  private translateBrushHandles(selection: any, chartAxes: ChartAxes) {
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

  private handleStartOfBrushingEvent(chartAxes: ChartAxes): void {
    if (this.histogramParams.brushHandlesHeightWeight <= 1 && this.histogramParams.brushHandlesHeightWeight > 0) {
      this.brushHandlesHeight = this.chartDimensions.height * this.histogramParams.brushHandlesHeightWeight;
    } else {
      this.brushHandlesHeight = this.chartDimensions.height;
    }
    this.selectionBrush.on('start', () => {
      const selection = event.selection;
      this.isBrushed = false;
      this.translateBrushHandles(selection, chartAxes);
    });
  }

  private handleOnBrushingEvent(chartAxes: ChartAxes): void {
    this.selectionBrush.on('brush', (datum: any, index: number) => {
      this.isBrushing = true;
      const selection = event.selection;
      if (selection !== null) {
        this.selectionInterval.startvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0];
        this.selectionInterval.endvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1];
        const dataInterval = this.histogramParams.bucketRange;
        this.histogramParams.startValue = HistogramUtils.toString(this.selectionInterval.startvalue, this.histogramParams, dataInterval);
        this.histogramParams.endValue = HistogramUtils.toString(this.selectionInterval.endvalue, this.histogramParams, dataInterval);
        this.histogramParams.showTitle = false;
        this.setBrushCornerTooltipsPositions();
        this.applyStyleOnSelection();
        this.translateBrushHandles(selection, chartAxes);
        this.clearTooltipCursor();
      }
    });
  }

  private handleEndOfBrushingEvent(chartAxes: ChartAxes): void {
    this.selectionBrush.on('end', (datum: any, index: number) => {
      const selection = event.selection;
      if (selection !== null) {
        if (!this.fromSetInterval && this.isBrushing) {
          this.selectionInterval.startvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[0];
          this.selectionInterval.endvalue = selection.map(chartAxes.xDomain.invert, chartAxes.xDomain)[1];
          const dataInterval = this.histogramParams.bucketRange;
          this.histogramParams.startValue = HistogramUtils.toString(this.selectionInterval.startvalue, this.histogramParams, dataInterval);
          this.histogramParams.endValue = HistogramUtils.toString(this.selectionInterval.endvalue, this.histogramParams, dataInterval);
          const selectionListInterval = [];
          this.histogramParams.intervalSelectedMap.forEach((k, v) => selectionListInterval.push(k.values));
          this.histogramParams.valuesListChangedEvent.next(selectionListInterval.concat(this.selectionInterval));

          const isSelectionBeyondDataDomain = HistogramUtils.isSelectionBeyondDataDomain(this.selectionInterval, this.dataDomain,
            this.histogramParams.intervalSelectedMap);
          if (!isSelectionBeyondDataDomain && this.hasSelectionExceededData) {
            this.plot(<Array<HistogramData>>this.histogramParams.histogramData);
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
