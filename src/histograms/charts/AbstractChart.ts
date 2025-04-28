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

import { max, min } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { D3BrushEvent } from 'd3-brush';
import { format } from 'd3-format';
import { scaleLinear } from 'd3-scale';
import { pointer, select } from 'd3-selection';
import { timeFormat, utcFormat } from 'd3-time-format';
import { Bucket, BucketsVirtualContext } from '../../histograms/buckets/buckets';
import { AbstractHistogram } from '../AbstractHistogram';
import { SelectionType } from '../HistogramParams';
import { Brush } from '../brushes/brush';
import { RectangleBrush } from '../brushes/rectangle-brush';
import { SliderBrush } from '../brushes/slider-brush';
import {
  ChartAxes,
  CURRENTLY_SELECTED_BARS,
  DataType,
  formatNumber,
  FULLY_SELECTED_BARS,
  getBarOptions,
  HistogramData,
  HistogramSVGClipPath,
  HistogramSVGG,
  HistogramSVGRect,
  HistogramUtils,
  PARTLY_SELECTED_BARS,
  Position,
  SelectedInputValues,
  SelectedOutputValues,
  tickNumberFormat,
  UNSELECTED_BARS
} from '../utils/HistogramUtils';


export abstract class AbstractChart extends AbstractHistogram {

  protected chartAxes: ChartAxes;
  protected yStartsFromMin = false;
  protected START_Y_FROM_MIN_STRIPES_PATTERN = 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2';
  protected START_Y_FROM_MIN_STRIPES_SIZE = 4;
  protected NO_DATA_STRIPES_PATTERN = 'M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2';
  protected NO_DATA_STRIPES_SIZE = 10;


  public brush: Brush;
  protected clipPathContext: HistogramSVGClipPath;
  protected currentClipPathContext: HistogramSVGClipPath;
  protected rectangleCurrentClipper: HistogramSVGRect;
  protected selectedIntervals = new Map<string, { rect: HistogramSVGRect; startEndValues: SelectedOutputValues; }>();

  /** Maximum number of buckets that a chart can have */
  private MAX_BUCKET_NUMBER = 1000;


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
      const extendedData = this.extendData(data);
      this.createChartAxes(extendedData);
      this.updateNumberOfLabelDisplayedIfOverlap(this.chartAxes, 0);
      this.drawChartAxes(this.chartAxes, 0);
      this.plotChart(data);
      this.handleBucketsInteractions(data, extendedData);

      if (this.histogramParams.isHistogramSelectable) {
        this.addSelectionBrush(this.histogramParams.selectionType, this.chartAxes, 0);
      }
      this.plottingCount++;
    } else {
      this.histogramParams.startValue = '';
      this.histogramParams.endValue = '';
      this.histogramParams.dataLength = 0;
      this.histogramParams.displaySvg = 'none';
    }
  }

  /**
   * - Shows a tooltip on hover of a dataBucket.
   * - Emits a hoveredBucketEvent on hover of one of the allBuckets.
   * @param dataBuckets Buckets provided by data that are plot on the histogram.
   * @param allBuckets Buckets composed of data buckets and buckets beyond the data domain (that include the selection range).
   * @param chartIsToSides (Optional) Sides of the y axis in case of multi-charts representation.
   */
  protected handleBucketsInteractions(dataBuckets: HistogramData[],
    allBuckets: HistogramData[], chartIsToSides?: Map<string, string>): void {
    this.bucketsContext = new BucketsVirtualContext();
    allBuckets.forEach(d => {
      const bucket = new Bucket(d, this.histogramParams, this.context, this.chartDimensions, this.chartAxes);
      this.bucketsContext.append(bucket);
      /** Plot the bucket for dev purpuses. It helps debug. */
      // bucket.plot();
    });
    this.context
      .on('mousemove', (event) => {
        this.onHoverBucket(allBuckets, event);
        this.setTooltipPositions(dataBuckets, event, chartIsToSides);
      })
      .on('mouseout', (event) => {
        this.onLeaveBucket(allBuckets, event);
        this.histogramParams.tooltip.isShown = false;
      });
  }



  private onHoverBucket(data: Array<HistogramData>, event: MouseEvent) {
    const xy = pointer(event);
    const xDomainValue = +this.chartAxes.xDomain.invert(xy[0]);
    const dataInterval = this.histogramParams.bucketRange;
    const hoveredBuckets = data.filter(b => +b.key <= xDomainValue && +b.key > xDomainValue - dataInterval);
    this.bucketsContext.interact(hoveredBuckets.map(d => +d.key));
  }

  private onLeaveBucket(data: Array<HistogramData>, event: MouseEvent) {
    const xy = pointer(event);
    const xDomainValue = +this.chartAxes.xDomain.invert(xy[0]);
    const dataInterval = this.histogramParams.bucketRange;
    const leftBuckets = data.filter(b => +b.key <= xDomainValue && +b.key > xDomainValue - dataInterval);
    this.bucketsContext.leaveAll(data.map(d => +d.key));
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
    this.brushCornerTooltips.leftCornerTooltip.xPosition = -this.chartDimensions.height + this.histogramParams.margin.left + leftPosition
      - this.brush.size();
    this.brushCornerTooltips.rightCornerTooltip.xPosition = this.histogramParams.margin.left + rightPosition
      + this.brush.size();
  }

  protected setBrushVerticalTooltipsYPositions() {
    if (this.histogramParams.xAxisPosition === Position.bottom) {
      this.brushCornerTooltips.leftCornerTooltip.yPosition = this.histogramParams.margin.top;
    } else {
      this.brushCornerTooltips.leftCornerTooltip.yPosition = this.histogramParams.margin.bottom;
    }
    this.brushCornerTooltips.rightCornerTooltip.yPosition = this.brushCornerTooltips.leftCornerTooltip.yPosition;
  }

  protected setBrushHorizontalTooltipsXPositions(leftPosition: number, rightPosition: number) {
    this.brushCornerTooltips.leftCornerTooltip.xPosition = leftPosition + this.histogramParams.margin.left;
    this.brushCornerTooltips.rightCornerTooltip.xPosition = this.histogramParams.margin.right + this.chartDimensions.width - rightPosition;
  }

  protected setBrushHorizontalTooltipsYPositions() {
    if (this.histogramParams.xAxisPosition === Position.bottom) {
      this.brushCornerTooltips.leftCornerTooltip.yPosition = this.chartDimensions.height + this.brush.size() + 10;
    } else {
      this.brushCornerTooltips.leftCornerTooltip.yPosition = -3;
    }
    this.brushCornerTooltips.rightCornerTooltip.yPosition = this.brushCornerTooltips.leftCornerTooltip.yPosition;
  }

  public setSelectedInterval(selectedInputValues: SelectedInputValues): void {
    this.checkSelectedValuesValidity(selectedInputValues);
    this.fromSetInterval = true;
    const parsedSelectedValues = HistogramUtils.parseSelectedValues(selectedInputValues, this.histogramParams.dataType);
    // Has the selection changed ?
    if (parsedSelectedValues.startvalue !== this.selectionInterval.startvalue
      || parsedSelectedValues.endvalue !== this.selectionInterval.endvalue) {
      // Set the new selection
      this.selectionInterval.startvalue = parsedSelectedValues.startvalue;
      this.selectionInterval.endvalue = parsedSelectedValues.endvalue;
      const dataInterval = this.getDataInterval(<Array<HistogramData>>this.histogramParams.histogramData);
      this.histogramParams.startValue = HistogramUtils.toString(this.selectionInterval.startvalue, this.histogramParams, dataInterval);
      this.histogramParams.endValue = HistogramUtils.toString(this.selectionInterval.endvalue, this.histogramParams, dataInterval);
      const data = this.dataDomain;
      if (data !== null) {
        // If beyond then outside of the scale of the axis
        if (HistogramUtils.isSelectionBeyondDataDomain(selectedInputValues, data, this.histogramParams.intervalSelectedMap)) {
          this.hasSelectionExceededData = true;
          this.plot(this.histogramParams.histogramData);
        } else {
          // Also check if there are no data beyond selection, then replot
          // There for when the axis are resized due to selection being [0,0] when first plotting
          if (this.hasSelectionExceededData
            || HistogramUtils.isDataDomainWithinSelection(selectedInputValues, data, this.histogramParams.intervalSelectedMap)) {
            this.hasSelectionExceededData = false;
            this.plot(this.histogramParams.histogramData);
          }
          const axes = this.getAxes();
          const selectionBrushStart = Math.max(0, axes.xDomain(this.selectionInterval.startvalue));
          const selectionBrushEnd = Math.min(axes.xDomain(this.selectionInterval.endvalue), this.chartDimensions.width);
          if (this.brush) {
            this.brush.move([selectionBrushStart, selectionBrushEnd]);
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

  public resize(histogramContainer: HTMLElement): void {
    this.histogramParams.histogramContainer = histogramContainer;
    if (this.isWidthFixed === false && this.plottingCount > 0) {
      this.histogramParams.chartWidth = this.histogramParams.histogramContainer.offsetWidth;
    }

    if (this.isHeightFixed === false && this.plottingCount > 0) {
      this.histogramParams.chartHeight = this.histogramParams.histogramContainer.offsetHeight;
    }

    this._isWidthIncrease = this._previousSize < this.histogramParams.chartWidth;
    this._previousSize = this.histogramParams.chartWidth;
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
    this.selectedIntervals.forEach((rectClipper, guid) => {
      rectClipper.rect.remove();
    });
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
    this.brush.brushContext.on('dblclick', () => {
      if (this.brush.isBrushed) {
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
    const svg = select<SVGElement, HistogramData>(this.histogramParams.svgNode);
    const margin = this.histogramParams.margin;
    const width = Math.max(+this.histogramParams.chartWidth - this.histogramParams.margin.left - this.histogramParams.margin.right, 0);
    const height = Math.max(+this.histogramParams.chartHeight - this.histogramParams.margin.top -
      this.histogramParams.margin.bottom - 2, 0);
    this.chartDimensions = { svg, margin, width, height };
  }

  protected createChartXAxes(data: Array<HistogramData>): void {
    const xDomain = this.getXDomainScale(0, this.chartDimensions.width);
    // The xDomain extent includes data domain and selected values
    const xDomainExtent = this.getXDomainExtent(data, this.selectionInterval.startvalue,
      this.selectionInterval.endvalue);
    xDomain.domain(xDomainExtent);

    this.chartAxes = {
      xDomain, yDomain: undefined, xTicksAxis: undefined,
      yTicksAxis: undefined, stepWidth: undefined, xLabelsAxis: undefined,
      yLabelsAxis: undefined, xAxis: undefined, yAxis: undefined
    };
    this.chartAxes.stepWidth = 0;
    this.chartAxes.xAxis = axisBottom(this.chartAxes.xDomain).tickSize(0);
    this.chartAxes.xTicksAxis = axisBottom(this.chartAxes.xDomain).ticks(this.histogramParams.xTicks).tickSize(this.minusSign * 4);
    const labelPadding = (this.histogramParams.xAxisPosition === Position.bottom) ? 9 : -15;
    this.chartAxes.xLabelsAxis = axisBottom(this.chartAxes.xDomain).tickSize(0)
      .tickPadding(labelPadding).ticks(this.histogramParams.xLabels);

    this.applyFormatOnXticks(data);
    if (this.histogramParams.dataType === DataType.time) {
      if (this.histogramParams.ticksDateFormat) {
        if (this.histogramParams.useUtc) {
          this.chartAxes.xLabelsAxis = this.chartAxes.xLabelsAxis.tickFormat(utcFormat(this.histogramParams.ticksDateFormat));
        } else {
          this.chartAxes.xLabelsAxis = this.chartAxes.xLabelsAxis.tickFormat(timeFormat(this.histogramParams.ticksDateFormat));
        }
      }
    } else {
      /** apply space between thousands, millions */
      this.chartAxes.xLabelsAxis = this.chartAxes.xLabelsAxis.
        tickFormat(d => tickNumberFormat(d, this.histogramParams.numberFormatChar));
    }
    this.chartAxes.stepWidth = 0;
    if (data.length > 1) {
      this.chartAxes.stepWidth = this.chartAxes.xDomain(data[1].key) - this.chartAxes.xDomain(data[0].key);
    } else {
      if (data[0].key === this.selectionInterval.startvalue && data[0].key === this.selectionInterval.endvalue) {
        this.chartAxes.stepWidth = this.chartAxes.xDomain(data[0].key) / (this.histogramParams.barWeight * 10);
      } else {
        this.chartAxes.stepWidth = this.chartAxes.xDomain(<number>data[0].key + this.dataInterval) - this.chartAxes.xDomain(data[0].key);
      }
    }
  }

  protected createChartAxes(data: Array<HistogramData>): void {
    this.createChartXAxes(data);

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
    this.chartAxes.yAxis = axisLeft(yDomain).tickSize(0).ticks(0);
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

    this.chartAxes.yDomain = yDomain;
    this.chartAxes.yTicksAxis = axisLeft(yDomain).ticks(this.histogramParams.yTicks).tickSizeOuter(0);
    this.chartAxes.yLabelsAxis = axisLeft(yDomain).tickSize(0).tickPadding(10).ticks(this.histogramParams.yLabels)
      .tickFormat(d => !this.histogramParams.shortYLabels ? tickNumberFormat(d, this.histogramParams.numberFormatChar) : format('~s')(d));
  }

  protected drawYAxis(chartAxes: ChartAxes, chartIdsToSide?: Map<string, 'left' | 'right'>, chartId?: string): void {
    // yTicksAxis and yLabelsAxis are translated of 1px to the left so that they are not hidden by the histogram
    let translate = 'translate(-1, 0)';
    let side: 'left' | 'right';
    if (!!chartId && !!chartIdsToSide) {
      side = chartIdsToSide.get(chartId);
    }
    if (!side) {
      side = 'left';
    }
    if (side === 'right') {
      translate = 'translate('.concat((this.chartDimensions.width + 1).toString()).concat(', 0)');
    }
    let axisColor: string;
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

  /**
   * Draws a indicator behind the hovered bucket of the histogram. This has as objective to highlight it on the histogram
   * @param data
   * @param axes
   */
  protected drawTooltipCursor(data: Array<HistogramData>, axes: ChartAxes, chartIsToSides?: Map<string, string>): void { }

  protected setTooltipPositions(data: Array<HistogramData>, event: MouseEvent, chartIsToSides?: Map<string, string>): void {
    const xy = pointer(event);
    const xDomainValue = +this.chartAxes.xDomain.invert(xy[0]);
    const dataInterval = this.histogramParams.bucketRange;
    const hoveredBuckets = data.filter(b => +b.key <= xDomainValue && +b.key > xDomainValue - dataInterval);
    const ys = [];
    let x;
    let xEndValue;
    let xStartValue;
    hoveredBuckets.forEach(hb => {
      if (HistogramUtils.isValueValid(hb)) {
        let color;
        if (!!hb.chartId && !!this.histogramParams.colorGenerator) {
          color = this.histogramParams.colorGenerator.getColor(hb.chartId);
        }
        x = HistogramUtils.toString(hb.key, this.histogramParams, dataInterval);
        const calculatedEndValue = dataInterval + (+hb.key);
        xStartValue = x;
        xEndValue = HistogramUtils.toString(calculatedEndValue, this.histogramParams, dataInterval);
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
          xStartValue: xStartValue,
          xEndValue: xEndValue,
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
      .parseDataKey(<Array<{ key: number; value: number; }>>this.histogramParams.histogramData, this.histogramParams.dataType);
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

  protected getbucketInterval(bucketInterval: number, dataType: DataType): {
    value: number;
    unit?: string;
  } {
    if (dataType === DataType.time) {
      const D_2_MS = 86400000;
      const M_2_MS = 30 * D_2_MS;
      const Y_2_MS = 12 * M_2_MS;
      const H_2_MS = 3600000;
      const timestampToInterval = new Map<number, { value: number; unit: string; }>();
      /** seconds */
      timestampToInterval.set(1000, { value: 1, unit: 'second' });
      timestampToInterval.set(2000, { value: 2, unit: 'seconds' });
      timestampToInterval.set(5000, { value: 5, unit: 'seconds' });
      timestampToInterval.set(10000, { value: 10, unit: 'seconds' });
      timestampToInterval.set(30000, { value: 30, unit: 'seconds' });
      /** minutes */
      timestampToInterval.set(60000, { value: 1, unit: 'minute' });
      timestampToInterval.set(120000, { value: 2, unit: 'minutes' });
      timestampToInterval.set(300000, { value: 5, unit: 'minutes' });
      timestampToInterval.set(600000, { value: 10, unit: 'minutes' });
      timestampToInterval.set(900000, { value: 15, unit: 'minutes' });
      timestampToInterval.set(1800000, { value: 30, unit: 'minutes' });
      /** hours */
      timestampToInterval.set(H_2_MS, { value: 1, unit: 'hour' });
      timestampToInterval.set(2 * H_2_MS, { value: 2, unit: 'hours' });
      timestampToInterval.set(3 * H_2_MS, { value: 3, unit: 'hours' });
      timestampToInterval.set(6 * H_2_MS, { value: 6, unit: 'hours' });
      timestampToInterval.set(12 * H_2_MS, { value: 12, unit: 'hours' });
      /** days */
      timestampToInterval.set(D_2_MS, { value: 1, unit: 'day' });
      timestampToInterval.set(2 * D_2_MS, { value: 2, unit: 'days' });
      timestampToInterval.set(7 * D_2_MS, { value: 1, unit: 'week' });
      timestampToInterval.set(10 * D_2_MS, { value: 10, unit: 'days' });
      timestampToInterval.set(14 * D_2_MS, { value: 2, unit: 'weeks' });
      timestampToInterval.set(15 * D_2_MS, { value: 15, unit: 'days' });
      /** months */
      timestampToInterval.set(M_2_MS, { value: 30, unit: 'days (~ 1 month)' });
      timestampToInterval.set(2 * M_2_MS, { value: 60, unit: 'days (~ 2 months)' });
      timestampToInterval.set(3 * M_2_MS, { value: 90, unit: 'days (~ 3 months)' });
      timestampToInterval.set(4 * M_2_MS, { value: 120, unit: 'days (~ 4 months)' });
      timestampToInterval.set(6 * M_2_MS, { value: 180, unit: 'days (~ 6 months)' });
      /** years 1, 2, 5, 10*/
      timestampToInterval.set(Y_2_MS, { value: 365, unit: 'days (~ 1 year)' });
      timestampToInterval.set(2 * Y_2_MS, { value: 730, unit: 'days (~ 2 years)' });
      timestampToInterval.set(5 * Y_2_MS, { value: 1825, unit: 'days (~ 5 years)' });
      timestampToInterval.set(10 * Y_2_MS, { value: 3650, unit: 'days (~ 10 years)' });
      const allIntervals = Array.from(timestampToInterval.keys()).map(i => +i).sort((a, b) => a - b);
      let value = allIntervals[0];
      for (let i = 0; i < allIntervals.length; i++) {
        if (i < allIntervals.length - 1) {
          const current = allIntervals[i];
          const next = allIntervals[i + 1];
          if (bucketInterval >= current && bucketInterval < next) {
            const leftDistance = Math.abs(bucketInterval - current);
            const rightDistance = Math.abs(bucketInterval - next);
            if (leftDistance < rightDistance) {
              value = current;
            } else {
              value = next;
            }
            break;
          }
        } else {
          value = allIntervals[i];
        }
      }
      return timestampToInterval.get(value);
    } else {
      const histogramParams = Object.assign({}, this.histogramParams);
      histogramParams.numberFormatChar = '';
      return { value: +HistogramUtils.toString(bucketInterval, histogramParams, bucketInterval) };
    }
  }

  protected getAxes() {
    return this.chartAxes;
  }

  protected addSelectionBrush(selectionType: SelectionType, chartAxes: ChartAxes, leftOffset: number): void {
    if (selectionType === SelectionType.rectangle) {
      this.brush = new RectangleBrush(this.context, this.chartDimensions, this.chartAxes)
        .setHandleHeight(this.histogramParams.handlesHeightWeight);
    } else {
      this.brush = new SliderBrush(this.context, this.chartDimensions, this.chartAxes)
        .setHandleRadius(this.histogramParams.handlesRadius);
    }
    const selectionBrushStart = Math.max(0, chartAxes.xDomain(this.selectionInterval.startvalue));
    const selectionBrushEnd = Math.min(chartAxes.xDomain(this.selectionInterval.endvalue), this.chartDimensions.width);
    this.brush
      .plot()
      .move([selectionBrushStart, selectionBrushEnd]);


    this.handleOnBrushingEvent(chartAxes);
    this.handleEndOfBrushingEvent(chartAxes);
  }

  protected applyStyleOnSelectedBars(barsContext: HistogramSVGG): void {
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

      barsContext.filter((d) => +d.key >= +this.selectionInterval.startvalue
        && +d.key + this.histogramParams.barWeight * this.dataInterval <= +this.selectionInterval.endvalue)
        .attr('fill', selectedFill)
        .attr('stroke', selectedStroke)
        .attr('stroke-width', selectedStrokeWidth);

      barsContext.filter((d) => (+d.key < +this.selectionInterval.startvalue || +d.key > +this.selectionInterval.endvalue)
        && (!this.selectedBars.has(+d.key)))
        .attr('fill', unselectedFill)
        .attr('stroke', unselectedStroke)
        .attr('stroke-width', unselectedStrokeWidth);

      barsContext.filter((d) => +d.key < +this.selectionInterval.startvalue && (!this.selectedBars.has(+d.key))
        && +d.key + this.histogramParams.barWeight * this.dataInterval > +this.selectionInterval.startvalue)
        .attr('fill', selectedFill)
        .attr('stroke', selectedStroke)
        .attr('stroke-width', selectedStrokeWidth);

      barsContext.filter((d) => +d.key <= +this.selectionInterval.endvalue && (!this.selectedBars.has(+d.key))
        && +d.key + this.histogramParams.barWeight * this.dataInterval > +this.selectionInterval.endvalue)
        .attr('fill', selectedFill)
        .attr('stroke', selectedStroke)
        .attr('stroke-width', selectedStrokeWidth);
    } else {
      barsContext.filter((d) => this.selectedBars.has(+d.key)).attr('class', FULLY_SELECTED_BARS);

      barsContext.filter((d) => +d.key >= +this.selectionInterval.startvalue
        && +d.key + this.histogramParams.barWeight * this.dataInterval <= +this.selectionInterval.endvalue)
        .attr('class', CURRENTLY_SELECTED_BARS);

      barsContext.filter((d) => (+d.key < +this.selectionInterval.startvalue || +d.key > +this.selectionInterval.endvalue)
        && (!this.selectedBars.has(+d.key)))
        .attr('class', UNSELECTED_BARS);

      barsContext.filter((d) => +d.key < +this.selectionInterval.startvalue && (!this.selectedBars.has(+d.key))
        && +d.key + this.histogramParams.barWeight * this.dataInterval > +this.selectionInterval.startvalue)
        .attr('class', PARTLY_SELECTED_BARS);

      barsContext.filter((d) => +d.key <= +this.selectionInterval.endvalue && (!this.selectedBars.has(+d.key))
        && +d.key + this.histogramParams.barWeight * this.dataInterval > +this.selectionInterval.endvalue)
        .attr('class', PARTLY_SELECTED_BARS);
    }
  }

  protected getAppendedRectangle(start: Date | number, end: Date | number): HistogramSVGRect {
    return this.clipPathContext.append('rect')
      .attr('id', 'clip-rect')
      .attr('x', this.chartAxes.xDomain(start))
      .attr('y', '0')
      .attr('width', this.chartAxes.xDomain(end) - this.chartAxes.xDomain(start))
      .attr('height', this.chartDimensions.height);
  }

  protected applyStyleOnClipper(): void {
    if (!this.checkDomainInitialized()) {
      return;
    }
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

  /**
   * When the selection is wider than the range of the data, adds "fake" buckets, for the x axis to be fully drawn
   * @param data Data to plot
   * @returns Extended data to fit the selection
   */
  protected extendData(data: Array<HistogramData>): Array<HistogramData> {
    if (this.selectionInterval.startvalue === this.selectionInterval.endvalue) {
      return data;
    }

    const bucketSize = this.getDataInterval(data);
    // The charts have a maximum number of buckets that can be plotted
    // To avoid errors, we intentionally not plotted it
    if ((+this.selectionInterval.endvalue - +this.selectionInterval.startvalue) / bucketSize > (this.MAX_BUCKET_NUMBER - data.length)) {
      return data;
    }

    let extendedData = new Array<HistogramData>();
    if (+data[0].key > +this.selectionInterval.startvalue) {
      let fakeDataKey = +data[0].key;
      while (fakeDataKey > +this.selectionInterval.startvalue) {
        fakeDataKey = fakeDataKey - bucketSize;
        if (this.histogramParams.dataType === DataType.numeric) {
          extendedData.unshift({
            key: fakeDataKey,
            value: 0
          });
        } else {
          extendedData.unshift({
            key: new Date(fakeDataKey),
            value: 0
          });
        }
      }
    }

    extendedData = extendedData.concat(data);
    // We need to add a bucket only if the start of the next bucket
    // is not in the data but included in the selection
    if (+data[data.length - 1].key + bucketSize < +this.selectionInterval.endvalue) {
      let fakeDataKey = +data[data.length - 1].key + bucketSize;
      while (fakeDataKey < +this.selectionInterval.endvalue) {
        fakeDataKey += +bucketSize;
        if (this.histogramParams.dataType === DataType.numeric) {
          extendedData.push({
            key: fakeDataKey,
            value: 0
          });
        } else {
          extendedData.push({
            key: new Date(fakeDataKey),
            value: 0
          });
        }
      }
    }

    return extendedData;
  }

  protected abstract plotChart(data: Array<HistogramData>): void;
  protected abstract applyStyleOnSelection(): void;
  protected abstract getStartPosition(data: Array<HistogramData>, index: number): number;
  protected abstract getEndPosition(data: Array<HistogramData>, index: number): number;
  protected abstract setTooltipXposition(xPosition: number): number;
  protected abstract setTooltipYposition(yPosition: number): number;

  private handleOnBrushingEvent(chartAxes: ChartAxes): void {
    this.brush.extent.on('brush', (event: D3BrushEvent<HistogramData>) => {
      this.brush.isBrushing = true;
      const selection = event.selection;
      this.brush.onBrushing();
      if (selection !== null) {
        this.selectionInterval.startvalue = selection.map(d => chartAxes.xDomain.invert(d), chartAxes.xDomain)[0];
        this.selectionInterval.endvalue = selection.map(d => chartAxes.xDomain.invert(d), chartAxes.xDomain)[1];
        const dataInterval = this.histogramParams.bucketRange;
        this.histogramParams.startValue = HistogramUtils.toString(this.selectionInterval.startvalue, this.histogramParams, dataInterval);
        this.histogramParams.endValue = HistogramUtils.toString(this.selectionInterval.endvalue, this.histogramParams, dataInterval);
        this.histogramParams.showTitle = false;
        this.setBrushCornerTooltipsPositions();
        this.applyStyleOnSelection();
        this.brush.translateBrushHandles(selection);
        this.clearTooltipCursor();
      }
    });
  }

  private handleEndOfBrushingEvent(chartAxes: ChartAxes): void {
    this.brush.extent.on('end', (event: D3BrushEvent<HistogramData>) => {
      const selection = event.selection;
      if (selection !== null) {
        if (!this.fromSetInterval && this.brush.isBrushing) {
          const dataInterval = this.histogramParams.bucketRange;
          this.selectionInterval.startvalue = HistogramUtils.roundValue(+selection.map(d => chartAxes.xDomain.invert(d), chartAxes.xDomain)[0],
            this.histogramParams, dataInterval);
          this.selectionInterval.endvalue = HistogramUtils.roundValue(+selection.map(d => chartAxes.xDomain.invert(d), chartAxes.xDomain)[1],
            this.histogramParams, dataInterval);

          this.histogramParams.startValue = HistogramUtils.toString(this.selectionInterval.startvalue, this.histogramParams, dataInterval);
          this.histogramParams.endValue = HistogramUtils.toString(this.selectionInterval.endvalue, this.histogramParams, dataInterval);
          const selectionListInterval = [];
          this.histogramParams.intervalSelectedMap.forEach((k, v) => selectionListInterval.push(k.values));
          this.histogramParams.valuesListChangedEvent.next(selectionListInterval.concat(this.selectionInterval));

          const isSelectionBeyondDataDomain = HistogramUtils.isSelectionBeyondDataDomain(this.selectionInterval, this.dataDomain,
            this.histogramParams.intervalSelectedMap);
          if (!isSelectionBeyondDataDomain && this.hasSelectionExceededData) {
            this.plot(this.histogramParams.histogramData);
            this.hasSelectionExceededData = false;
          }
        }
        this.histogramParams.showTitle = true;
        this.brush.isBrushing = false;
        this.brush.isBrushed = true;
      } else {
        this.brush.translateBrushHandles(null);
      }
      this.brush.onBrushEnd();
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

  protected checkDomainInitialized(): boolean {
    return !(this.chartAxes.xDomain(this.selectionInterval.startvalue) === undefined
      || this.chartAxes.xDomain(this.selectionInterval.endvalue) === undefined);
  }
}
