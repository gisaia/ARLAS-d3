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
import { SwimlaneAxes, HistogramData, HistogramUtils, DataType, Tooltip } from '../utils/HistogramUtils';
import * as d3 from 'd3';

export abstract class AbstractSwimlane extends AbstractHistogram {

  protected swimlaneAxes: SwimlaneAxes;
  protected swimlaneMaxValue: number = null;
  protected nbSwimlanes: number;
  protected swimlaneIntervalBorders: [number | Date, number | Date];
  protected isSwimlaneHeightFixed = false;
  protected swimlaneHasMoreThanTwoBuckets = false;
  protected swimlaneContextList = new Array<any>();
  protected verticalTooltipLine;
  protected labelsContext;
  protected aBucketIsEncountred = false;

  public plot(inputData: Map<string, Array<{ key: number, value: number }>>) {
    super.plot(inputData);
    // this.dataDomain = inputData;
    let swimlanesMapData: Map<string, Array<HistogramData>> = null;
    if (inputData !== null && inputData.size > 0) {
      this.setSwimlaneMaxValue(inputData);
      swimlanesMapData = HistogramUtils.parseSwimlaneDataKey(inputData, this.histogramParams.dataType);
      this.nbSwimlanes = swimlanesMapData.size;
      this.setSwimlaneMinMaxValues(swimlanesMapData);
      this.initializeDescriptionValues(this.swimlaneIntervalBorders[0], this.swimlaneIntervalBorders[1]);
      this.initializeChartDimensions();
      this.createSwimlaneAxes(swimlanesMapData);
      this.drawChartAxes(this.swimlaneAxes);
      this.addLabels(swimlanesMapData);
      this.plotSwimlane(swimlanesMapData);
      this.showTooltipsForSwimlane(swimlanesMapData);
      if (this.histogramParams.isHistogramSelectable) {
        this.addSelectionBrush(this.swimlaneAxes);
      }
      this.plottingCount++;
    } else {
      this.histogramParams.startValue = '';
      this.histogramParams.endValue = '';
      this.histogramParams.dataLength = 0;
    }
  }

  public resize(histogramContainer: HTMLElement): void {
    this.histogramParams.histogramContainer = histogramContainer;
    if (this.isWidthFixed === false) {
      this.histogramParams.chartWidth = this.histogramParams.histogramContainer.offsetWidth;
    }

    if (this.isHeightFixed === false) {
      if (this.isSwimlaneHeightFixed === false) {
        this.histogramParams.chartHeight = this.histogramParams.histogramContainer.offsetHeight;
      } else {
        this.nbSwimlanes = (<Map<string, Array<{ key: number, value: number }>>>this.histogramParams.data).size;
        this.histogramParams.chartHeight = this.histogramParams.swimlaneHeight * this.nbSwimlanes + this.histogramParams.margin.top +
         this.histogramParams.margin.bottom;
      }
    }

    if (this.isSwimlaneHeightFixed === false) {
      this.histogramParams.swimlaneHeight = Math.max(+this.histogramParams.chartHeight
        - this.histogramParams.margin.top - this.histogramParams.margin.bottom, 0)  / this.nbSwimlanes;
    }
    this.plot(<Map<string, Array<{ key: number, value: number }>>>this.histogramParams.data);
    if (this.histogramParams.multiselectable) {
      this.resizeSelectedIntervals(this.swimlaneAxes);
    }
  }

  public removeSelectInterval(id: string) {
    super.removeSelectInterval(id);
    const isSelectionBeyondDataDomain = HistogramUtils.isSelectionBeyondDataDomain(this.selectionInterval, this.dataDomain,
      this.histogramParams.intervalSelectedMap);
    if (!isSelectionBeyondDataDomain && this.hasSelectionExceededData) {
      this.plot(<Map<string, Array<{key: number, value: number}>>>this.histogramParams.data);
      this.hasSelectionExceededData = false;
    } else if (isSelectionBeyondDataDomain) {
      this.plot(<Map<string, Array<{key: number, value: number}>>>this.histogramParams.data);
    }
  }

  public truncateLabels() {
    if (this.labelsContext !== undefined) {
      (this.labelsContext.selectAll('text')).nodes().forEach((textNode) => {
        const self = d3.select(textNode);
        let textLength = self.node().getComputedTextLength();
        let text = self.text();
        while (textLength > (this.histogramParams.swimLaneLabelsWidth) && text.length > 0) {
          text = text.slice(0, -1);
          self.text(text + '...');
          textLength = self.node().getComputedTextLength();
        }
      });
    }
  }

  protected plotSwimlane(data: Map<string, Array<HistogramData>>): void {
    this.swimlaneContextList = new Array<any>();
    const keys = data.keys();
    for (let i = 0; i < data.size; i++) {
      const key = keys.next().value;
      this.plotOneLane(data.get(key), i);
      this.swimlaneContextList.push(this.barsContext);
    }
  }

  protected getIntervalMiddlePositon(chartAxes: SwimlaneAxes, startvalue: number, endvalue: number): number {
    const keys = this.getSelectedBars(startvalue, endvalue);
    const lastKey = keys.sort((a, b) => { if (a > b) { return a; } })[keys.length - 1];
    const firstKey = keys.sort((a, b) => { if (a > b) { return a; } })[0];
    const firstPosition = chartAxes.xDomain(firstKey);
    const lastPosition = chartAxes.xDomain(lastKey);
    return (firstPosition + lastPosition) / 2 + this.histogramParams.swimLaneLabelsWidth;
  }

  protected addSelectionBrush(swimlaneAxes: SwimlaneAxes): void {
    super.addSelectionBrush(swimlaneAxes, this.histogramParams.swimLaneLabelsWidth);
    if (this.histogramParams.multiselectable) {
      this.onSelectionDoubleClick(swimlaneAxes);
    }
    this.applyStyleOnSelection();
  }

  protected getSelectedBars(startvalue: number, endvalue: number): Array<number> {
    const keys = new Array<number>();
    this.swimlaneContextList.forEach(barcontext => {
      (barcontext).filter((d) => {
        d.key = +d.key;
        return d.key >= startvalue
          && d.key + this.histogramParams.barWeight * this.dataInterval <= endvalue;
      }).data().map(d => { this.selectedBars.add(d.key); keys.push(d.key); });
    });
    return keys;
  }

  protected applyStyleOnSelection(): void {
    this.swimlaneContextList.forEach(swimlaneContext => this.applyStyleOnSelectedBars(swimlaneContext));
  }

  protected initializeChartDimensions(): void {
    super.initializeChartDimensions();
    if (this.histogramParams.swimLaneLabelsWidth === null) {
      this.histogramParams.swimLaneLabelsWidth = this.histogramParams.chartWidth * 20 / 100;
    }
    this.yDimension = 0;
    if (this.histogramParams.swimlaneHeight === null) {
      this.initializeChartHeight();
      this.histogramParams.swimlaneHeight = Math.max(+this.histogramParams.chartHeight
        - this.histogramParams.margin.top - this.histogramParams.margin.bottom, 0) / this.nbSwimlanes;
    } else if (this.histogramParams.swimlaneHeight !== null && this.plottingCount === 0) {
      this.isSwimlaneHeightFixed = true;
      this.histogramParams.chartHeight = this.histogramParams.swimlaneHeight * this.nbSwimlanes
      + this.histogramParams.margin.top + this.histogramParams.margin.bottom;
    } else if (this.histogramParams.swimlaneHeight !== null && this.plottingCount !== 0) {
      if (this.isHeightFixed) {
        this.histogramParams.swimlaneHeight = Math.max(+this.histogramParams.chartHeight
          - this.histogramParams.margin.top - this.histogramParams.margin.bottom, 0) / this.nbSwimlanes;
      } else {
        this.histogramParams.chartHeight = this.histogramParams.swimlaneHeight * this.nbSwimlanes
        + this.histogramParams.margin.top + this.histogramParams.margin.bottom;
      }
    }
    const svg = d3.select(this.histogramParams.svgNode);
    const margin = this.histogramParams.margin;
    const width = Math.max(+this.histogramParams.chartWidth - this.histogramParams.margin.left - this.histogramParams.margin.right, 0);
    const height = Math.max(+this.histogramParams.chartHeight - this.histogramParams.margin.top - this.histogramParams.margin.bottom, 0);
    this.chartDimensions = { svg, margin, width, height };
  }

  protected createSwimlaneAxes(data: Map<string, Array<HistogramData>>): void {
    const xDomain = (this.getXDomainScale()).range([0, this.chartDimensions.width - this.histogramParams.swimLaneLabelsWidth]);
    let bucketKey = +this.swimlaneIntervalBorders[0];
    this.setSwimlaneDataInterval(data);
    const swimlaneArray = new Array<any>();
    while (bucketKey <= (+this.swimlaneIntervalBorders[1])) {
      swimlaneArray.push({ key: bucketKey, value: 0 });
      bucketKey = bucketKey + this.dataInterval;
    }
    this.dataDomain = swimlaneArray;
    this.histogramParams.dataLength = this.dataDomain.length;
    if (this.histogramParams.dataLength === 1) {
      this.histogramParams.dataLength++;
      this.histogramParams.barWeight = 0.05;
    }

    // The xDomain extent includes data domain and selected values
    const xDomainExtent = this.getXDomainExtent(this.dataDomain,
      this.selectionInterval.startvalue, this.selectionInterval.endvalue);
    xDomain.domain(xDomainExtent);
    // xDataDomain includes data domain only
    const xDataDomainArray = [];
    let xAxis;
    let xTicksAxis;
    let xLabelsAxis;
    let stepWidth;
    // Compute the range (in pixels) of xDataDomain where data will be plotted
    const ticksPeriod = Math.max(1, Math.round(this.dataDomain.length / this.histogramParams.xTicks));
    const labelsPeriod = Math.max(1, Math.round(this.dataDomain.length / this.histogramParams.xLabels));
    const startAllDataRange = xDomain(this.dataDomain[0].key);
    const endAllDataRange = xDomain(+this.dataDomain[this.dataDomain.length - 1].key + this.dataInterval);

    const xAllDataDomain = d3.scaleBand().range([startAllDataRange, endAllDataRange]).paddingInner(0);
    xAllDataDomain.domain(this.dataDomain.map((d) => (d.key).toString()));
    if (this.histogramParams.dataType === DataType.numeric) {
      xTicksAxis = d3.axisBottom(xDomain).tickPadding(5).tickValues(xAllDataDomain.domain()
        .filter((d, i) => !(i % ticksPeriod))).tickSize(this.minusSign * 5);
      xLabelsAxis = d3.axisBottom(xDomain).tickSize(0).tickPadding(this.minusSign * 12).tickValues(xAllDataDomain.domain()
        .filter((d, i) => !(i % labelsPeriod)));
    } else {
      xTicksAxis = d3.axisBottom(xDomain).ticks(this.histogramParams.xTicks).tickSize(this.minusSign * 5);
      xLabelsAxis = d3.axisBottom(xDomain).tickSize(0).tickPadding(this.minusSign * 12).ticks(this.histogramParams.xLabels);
    }
    xAxis = d3.axisBottom(xDomain).tickSize(0);

    data.forEach(swimlane => {
      const startRange = xDomain(swimlane[0].key);
      let endRange;
      let xDataDomain;
      stepWidth = xDomain(+swimlane[0].key + this.dataInterval) - xDomain(+swimlane[0].key);
      endRange = xDomain(+swimlane[swimlane.length - 1].key + this.dataInterval);
      xDataDomain = d3.scaleBand().range([startRange, endRange]).paddingInner(0);
      xDataDomain.domain(swimlane.map((d) => d.key));
      xDataDomainArray.push(xDataDomain);
    });
    this.swimlaneAxes = { xDomain, xDataDomainArray, xTicksAxis, stepWidth, xLabelsAxis, xAxis };
  }

  protected drawChartAxes(swimlaneAxes: SwimlaneAxes) {
    super.drawChartAxes(swimlaneAxes, this.histogramParams.swimLaneLabelsWidth);
    this.drawLineSeparators();
    this.xTicksAxis.call(this.swimlaneAxes.xTicksAxis.tickSize(-this.minusSign * this.chartDimensions.height));
  }

  protected drawLineSeparators(): void {
    for (let i = 0; i <= (<Map<string, Array<{ key: number, value: number }>>>this.histogramParams.data).size; i++) {
      this.allAxesContext.append('g')
        .attr('class', 'histogram__line-separator')
        .attr('transform', 'translate(' + this.histogramParams.swimLaneLabelsWidth + ',' + this.histogramParams.swimlaneHeight * i + ')')
        .call(this.swimlaneAxes.xAxis);
    }
  }

  protected showTooltipsForSwimlane(swimlaneMapData: Map<string, Array<HistogramData>>): void {
    this.histogramParams.swimlaneXTooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
    this.verticalTooltipLine = this.context.append('g').append('line').attr('class', 'histogram__swimlane--vertical-tooltip-line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', this.chartDimensions.height)
      .style('display', 'none');
    this.context
      .on('mousemove', () => {
        let i = 0;
        this.aBucketIsEncountred = false;
        const previousHoveredBucketKey = this.hoveredBucketKey;
        this.hoveredBucketKey = null;
        swimlaneMapData.forEach((swimlane, key) => {
          this.setTooltipPositionForSwimlane(swimlane, key, i, swimlaneMapData.size, <d3.ContainerElement>this.context.node());
          i++;
        });
        if (!this.aBucketIsEncountred) {
          this.histogramParams.swimlaneXTooltip.isShown = false;
          this.verticalTooltipLine.style('display', 'none');
        } else {
          if (this.hoveredBucketKey !== previousHoveredBucketKey && this.hoveredBucketKey !== null) {
            this.histogramParams.hoveredBucketEvent.next(this.hoveredBucketKey);
          }
        }
      })
      .on('mouseout', () => {
        this.histogramParams.swimlaneTooltipsMap.forEach((tooltipPositon, key) => {
          const hiddenTooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
          this.histogramParams.swimlaneXTooltip.isShown = false;
          this.histogramParams.swimlaneTooltipsMap.set(key, hiddenTooltip);
        });
        this.verticalTooltipLine.style('display', 'none');
      });
  }

  protected setTooltipPositionForSwimlane(data: Array<HistogramData>, key: string, indexOfKey: number, numberOfSwimlane: number,
    container: d3.ContainerElement): void {
    const xy = d3.mouse(container);
    let dx, dy, startPosition, endPosition, middlePosition;
    const tooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
    for (let i = 0; i < data.length; i++) {
      startPosition = this.histogramParams.swimLaneLabelsWidth + this.swimlaneAxes.xDomain(data[i].key);
      endPosition = startPosition + this.swimlaneAxes.stepWidth * this.histogramParams.barWeight;
      middlePosition = startPosition + this.swimlaneAxes.stepWidth * this.histogramParams.barWeight / 2;

      if (xy[0] >= startPosition && xy[0] < endPosition && !this.isBrushing) {
        this.verticalTooltipLine.style('display', 'block').attr('transform', 'translate(' + middlePosition + ',' + '0)');
        tooltip.isShown = true;
        dx = this.setTooltipXposition(xy[0], tooltip);
        dy = this.setTooltipYposition(xy[1]);
        tooltip.xPosition = (xy[0] + dx);
        tooltip.yPosition = this.histogramParams.swimlaneHeight * (indexOfKey + 0.2);
        tooltip.xContent = HistogramUtils.toString(data[i].key, this.histogramParams.chartType,
          this.histogramParams.dataType, this.histogramParams.valuesDateFormat);
        tooltip.yContent = data[i].value.toString();
        this.histogramParams.swimlaneXTooltip = tooltip;
        this.histogramParams.swimlaneTooltipsMap.set(key, tooltip);
        this.aBucketIsEncountred = true;
        this.hoveredBucketKey = data[i].key;
        break;
      } else {
        if (this.isBrushing) {
          this.verticalTooltipLine.style('display', 'none');
        }
        const hiddenTooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
        this.histogramParams.swimlaneTooltipsMap.set(key, hiddenTooltip);
      }
    }
  }

  protected setTooltipXposition(xPosition: number, tooltip: Tooltip): number {
    let dx;
    if (xPosition > (this.chartDimensions.width - this.histogramParams.swimLaneLabelsWidth) / 2) {
      tooltip.isRightSide = true;
      dx = (this.chartDimensions.width) - 2 * xPosition + 25;
    } else {
      tooltip.isRightSide = false;
      dx = 25;
    }
    return dx;
  }

  protected setTooltipYposition(yPosition: number): number {
    return 0;
  }

  protected addLabels(swimlanesMapData: Map<string, Array<HistogramData>>) {
    this.labelsContext = this.context.append('g').classed('foreignObject', true);
    let i = 0;
    swimlanesMapData.forEach((swimlane, key) => {
      this.labelsContext.append('text')
        .text(() => key)
        .attr('transform', 'translate(0,' + this.histogramParams.swimlaneHeight * (i + 0.6) + ')');
      i++;
    });
  }

  protected setSwimlaneDataInterval(swimlaneData: Map<string, Array<HistogramData>>): void {
    const keys = swimlaneData.keys();
    for (let i = 0; i < swimlaneData.size; i++) {
      const key = keys.next().value;
      if (swimlaneData.get(key).length > 1) {
        this.swimlaneHasMoreThanTwoBuckets = true;
        this.histogramParams.displaySvg = 'block';
        this.dataInterval =  (+swimlaneData.get(key)[1].key - +swimlaneData.get(key)[0].key);
        break;
      }
    }
    if (!this.swimlaneHasMoreThanTwoBuckets) {
      this.histogramParams.displaySvg = 'block';
      // all the lanes has 1 bucket maximum
      let previousKeyPosition = null;
      let currentKeyPosition = null;
      let interval = Number.MAX_VALUE;
      swimlaneData.forEach((swimlane, key) => {
        previousKeyPosition = currentKeyPosition;
        currentKeyPosition = +swimlane[0].key;
        if (previousKeyPosition !== null && previousKeyPosition !== currentKeyPosition) {
          interval = Math.max(0, Math.min(interval, Math.abs(currentKeyPosition - previousKeyPosition)));
        }
      });
      this.dataInterval = (interval === 0 || interval === Number.MAX_VALUE) ? 1 : interval;
    }
  }

  protected setDataInterval(swimlaneData: Array<HistogramData> | Map<string, Array<HistogramData>>): void {
  }

  protected setSwimlaneMaxValue(swimlaneDataMap: Map<string, Array<{ key: number, value: number }>>) {
    this.swimlaneMaxValue = null;
    swimlaneDataMap.forEach((swimlane, key) => {
      if (this.swimlaneMaxValue === null) {
        this.swimlaneMaxValue = swimlane[0].value;
      }
      swimlane.forEach(element => {
        if (element.value > this.swimlaneMaxValue) {
          this.swimlaneMaxValue = element.value;
        }
      });
    });
  }

  protected setSwimlaneMinMaxValues(swimlanesMapData: Map<string, Array<HistogramData>>) {
    const firstKey = swimlanesMapData.keys().next().value;
    const firstArrayLength = swimlanesMapData.get(firstKey).length;
    let minInterval = swimlanesMapData.get(firstKey)[0].key;
    let maxInterval = swimlanesMapData.get(firstKey)[firstArrayLength - 1].key;
    swimlanesMapData.forEach((swimlane, key) => {
      if (swimlane[0].key <= minInterval) {
        minInterval = swimlane[0].key;
      }
      if (swimlane[swimlane.length - 1].key >= maxInterval) {
        maxInterval = swimlane[swimlane.length - 1].key;
      }
    });
    this.swimlaneIntervalBorders = [minInterval, maxInterval];
  }

  protected getAxes() {
    return this.swimlaneAxes;
  }

  protected setBrushVerticalTooltipsXPositions(leftPosition: number, rightPosition: number) {
    this.histogramParams.brushLeftTooltip.xPosition = this.histogramParams.swimLaneLabelsWidth -
      this.chartDimensions.height + this.histogramParams.margin.left + leftPosition;
    this.histogramParams.brushRightTooltip.xPosition = this.histogramParams.swimLaneLabelsWidth +
      this.histogramParams.margin.left  + rightPosition;
  }

  protected setBrushHorizontalTooltipsXPositions(leftPosition: number, rightPosition: number) {
    this.histogramParams.brushLeftTooltip.xPosition = this.histogramParams.swimLaneLabelsWidth + leftPosition +
      this.histogramParams.margin.left;
    this.histogramParams.brushRightTooltip.xPosition = -this.histogramParams.swimLaneLabelsWidth + this.histogramParams.margin.right +
      this.chartDimensions.width - rightPosition;
  }

  protected abstract plotOneLane(data: Array<HistogramData>, indexOfLane: number): void;

}
