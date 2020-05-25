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
import { SwimlaneAxes, HistogramData, HistogramUtils,
   DataType, Tooltip, Position, SwimlaneData, SwimlaneStats, SwimlaneRepresentation,
   LaneStats, SwimlaneOptions, NAN_COLOR, formatWithSpace } from '../utils/HistogramUtils';
import { select, mouse, ContainerElement } from 'd3-selection';
import { scaleBand } from 'd3-scale';
import { axisBottom } from 'd3-axis';

export abstract class AbstractSwimlane extends AbstractHistogram {

  protected swimlaneAxes: SwimlaneAxes;
  protected swimlaneIntervalBorders: [number | Date, number | Date];
  protected isSwimlaneHeightFixed = false;
  protected swimlaneHasMoreThanTwoBuckets = false;
  protected swimlaneContextList = new Array<{name: string, context: any}>();
  protected verticalTooltipLine;
  protected labelsContext;
  protected aBucketIsEncountred = false;
  protected swimlaneBarsWeight;
  protected labelsContextList = new Array<{name: string, context: any}>();
  protected labelsRectContextList = new Array<{name: string, context: any}>();

  public plot(inputData: SwimlaneData) {
    super.init();
    let swimlanesMapData: Map<string, Array<HistogramData>> = null;
    if (inputData !== null && inputData.lanes.size > 0) {
      swimlanesMapData = HistogramUtils.parseSwimlaneDataKey(inputData.lanes, this.histogramParams.dataType);
      this.setSwimlaneMinMaxBorders(inputData.stats);
      this.initializeDescriptionValues(this.swimlaneIntervalBorders[0], this.swimlaneIntervalBorders[1], inputData.lanes);
      this.initializeChartDimensions();
      this.createSwimlaneAxes(swimlanesMapData);
      this.drawChartAxes(this.swimlaneAxes);
      this.addLabels(swimlanesMapData);
      this.plotSwimlane(swimlanesMapData);
      this.applyStyleOnSwimlanes();
      this.buildLegend(inputData.stats);
      this.showTooltipsForSwimlane(swimlanesMapData, inputData.stats, this.histogramParams.swimlaneRepresentation);
      this.plottingCount++;
    } else {
      this.histogramParams.startValue = '';
      this.histogramParams.endValue = '';
      this.histogramParams.dataLength = 0;
      this.histogramParams.displaySvg = 'none';
    }
  }

  public buildLegend(stats: SwimlaneStats): void {
    const legend = [];
    if (this.histogramParams.swimlaneRepresentation === SwimlaneRepresentation.column) {
      for (let i = 0; i <= 100; i += 10 ) {
        let color;
        if (i === 0 && this.histogramParams.swimlaneOptions && this.histogramParams.swimlaneOptions.zeros_color) {
          color = this.histogramParams.swimlaneOptions.zeros_color;
          legend.push({key: i + '%', color: color});
        } else {
          color = HistogramUtils.getColor(i / 100, this.histogramParams.paletteColors).toHexString();
        }
        if (i === 0 && this.histogramParams.swimlaneOptions && this.histogramParams.swimlaneOptions.zeros_color) {
          color = HistogramUtils.getColor(i / 100, this.histogramParams.paletteColors).toHexString();
          legend.push({key: ' ', color: '#fff'});
          legend.push({key: '>0%', color: color});
        } else {
          const key = (i % 50 === 0) ? i + '%' : ' ';
          legend.push({key, color});
        }
      }
    } else {
      const min = stats.globalStats.min;
      const max = stats.globalStats.max;
      const span = (max - min) / 10;
      for (let i = 0; i <= 10; i ++ ) {
        const colorValue = min + span * i;
        let color;
        if (colorValue === 0 && this.histogramParams.swimlaneOptions && this.histogramParams.swimlaneOptions.zeros_color) {
          color = this.histogramParams.swimlaneOptions.zeros_color;
          legend.push({key: colorValue, color: color});
        } else {
          color = HistogramUtils.getColor(colorValue / max, this.histogramParams.paletteColors).toHexString();
        }
        if (i === 0 && this.histogramParams.swimlaneOptions && this.histogramParams.swimlaneOptions.zeros_color) {
          color = HistogramUtils.getColor(i / 100, this.histogramParams.paletteColors).toHexString();
          legend.push({key: ' ', color: '#fff'});
          legend.push({key: '>0', color: color});
        } else {
          const key = (i % 5 === 0) ? HistogramUtils.numToString(colorValue) : ' ';

          legend.push({key, color});
        }
      }
    }
    this.histogramParams.legend = legend;
  }

  public resize(histogramContainer: HTMLElement): void {
    this.histogramParams.histogramContainer = histogramContainer;
    if (this.isWidthFixed === false && this.plottingCount > 0) {
      this.histogramParams.chartWidth = this.histogramParams.histogramContainer.offsetWidth;
    }

    if (this.isHeightFixed === false && this.plottingCount > 0) {
      if (this.isSwimlaneHeightFixed === false) {
        this.histogramParams.chartHeight = this.histogramParams.histogramContainer.offsetHeight;
      } else {
        this.histogramParams.chartHeight = this.histogramParams.swimlaneHeight * this.histogramParams.swimlaneData.stats.nbLanes
         + this.histogramParams.margin.top +
         this.histogramParams.margin.bottom;
      }
    }

    if (this.isSwimlaneHeightFixed === false) {
      this.histogramParams.swimlaneHeight = Math.max(+this.histogramParams.chartHeight
        - this.histogramParams.margin.top - this.histogramParams.margin.bottom, 0)  / this.histogramParams.swimlaneData.stats.nbLanes;
    }
    this.plot(this.histogramParams.swimlaneData);
  }

  public truncateLabels() {
    if (this.labelsContext !== undefined) {
      (this.labelsContext.selectAll('text')).nodes().forEach((textNode) => {
        const self = select(textNode);
        let textLength = self.node().getComputedTextLength();
        let text = self.text();
        while (textLength > (this.histogramParams.swimLaneLabelsWidth - 8) && text.length > 0) { // 8px because the
          // text is translated by 3px to the right and the container of text occupies swimLaneLabelsWidth - 5px.
          text = text.slice(0, -1);
          self.text(text + '...');
          textLength = self.node().getComputedTextLength();
        }
      });
    }
  }

  public applyStyleOnSwimlanes(): void {
    let i = 0;
    if (!this.histogramParams.selectedSwimlanes) {
      this.histogramParams.selectedSwimlanes = new Set<string>();
    }
    this.swimlaneContextList.forEach(swimlaneContext => {
      if (this.histogramParams.selectedSwimlanes.size === 0) {
        swimlaneContext.context.attr('class', 'histogram__chart--bar__fullyselected');
        this.labelsContextList[i].context.attr('class', 'swimlane-label-neutral');
        this.labelsRectContextList[i].context.attr('class', 'swimlane-label-container-neutral');
      } else {
        if (this.histogramParams.selectedSwimlanes.has(swimlaneContext.name)) {
          swimlaneContext.context.attr('class', 'histogram__chart--bar__fullyselected');
          this.labelsContextList[i].context.attr('class', 'swimlane-label-selected');
          this.labelsRectContextList[i].context.attr('class', 'swimlane-label-container-selected');
        } else {
          swimlaneContext.context.attr('class', 'histogram__chart--bar');
          this.labelsContextList[i].context.attr('class', 'swimlane-label-unselected');
          this.labelsRectContextList[i].context.attr('class', 'swimlane-label-container-unselected');
        }
      }
      i++;
    });
  }

  protected applyHoverStyleOnSwimlaneLabels(labelRectContext: {name: string, context: any}): void {
    if (this.histogramParams.selectedSwimlanes.size === 0) {
      labelRectContext.context.attr('class', 'swimlane-label-container-neutral');
    } else {
      if (this.histogramParams.selectedSwimlanes.has(labelRectContext.name)) {
        labelRectContext.context.attr('class', 'swimlane-label-container-selected');
      } else {
        labelRectContext.context.attr('class', 'swimlane-label-container-unselected');
      }
    }
  }

  protected plotSwimlane(data: Map<string, Array<HistogramData>>): void {
    this.swimlaneContextList = new Array<{name: string, context: any}>();
    const keys = data.keys();
    for (let i = 0; i < data.size; i++) {
      const key = keys.next().value;
      this.plotOneLane(data.get(key), i);
      this.swimlaneContextList.push({name: key, context: this.barsContext});
    }

    this.swimlaneContextList.forEach(swimlaneContext => {
      swimlaneContext.context.on('click', () => {
        this.setSelectedSwimlanes(swimlaneContext);
      });
    });
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
        - this.histogramParams.margin.top - this.histogramParams.margin.bottom, 0) / this.histogramParams.swimlaneData.stats.nbLanes;
    } else if (this.histogramParams.swimlaneHeight !== null && this.plottingCount === 0) {
      this.isSwimlaneHeightFixed = true;
      this.histogramParams.chartHeight = this.histogramParams.swimlaneHeight * this.histogramParams.swimlaneData.stats.nbLanes
      + this.histogramParams.margin.top + this.histogramParams.margin.bottom;
    } else if (this.histogramParams.swimlaneHeight !== null && this.plottingCount !== 0) {
      if (this.isHeightFixed) {
        this.histogramParams.swimlaneHeight = Math.max(+this.histogramParams.chartHeight
          - this.histogramParams.margin.top - this.histogramParams.margin.bottom, 0) / this.histogramParams.swimlaneData.stats.nbLanes;
      } else {
        this.histogramParams.chartHeight = this.histogramParams.swimlaneHeight * this.histogramParams.swimlaneData.stats.nbLanes
        + this.histogramParams.margin.top + this.histogramParams.margin.bottom;
      }
    }
    const svg = select(this.histogramParams.svgNode);
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
    while (bucketKey < (+this.swimlaneIntervalBorders[1])) {
      swimlaneArray.push({ key: bucketKey, value: 0 });
      bucketKey = bucketKey + this.dataInterval;
    }
    this.dataDomain = swimlaneArray;
    this.histogramParams.dataLength = this.dataDomain.length;
    if (this.histogramParams.dataLength === 1) {
      this.histogramParams.dataLength++;
      this.swimlaneBarsWeight = 0.05;
    } else {
      this.swimlaneBarsWeight = this.histogramParams.barWeight;
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

    const xAllDataDomain = scaleBand().range([startAllDataRange, endAllDataRange]).paddingInner(0);
    xAllDataDomain.domain(this.dataDomain.map((d) => (d.key).toString()));
    const labelPadding = (this.histogramParams.xAxisPosition === Position.bottom) ? 9 : -15;
    if (this.histogramParams.dataType === DataType.numeric) {
      xTicksAxis = axisBottom(xDomain).tickPadding(5).tickValues(xAllDataDomain.domain()
        .filter((d, i) => !(i % ticksPeriod))).tickSize(this.minusSign * 4);
      xLabelsAxis = axisBottom(xDomain).tickSize(0).tickPadding(labelPadding).tickValues(xAllDataDomain.domain()
        .filter((d, i) => !(i % labelsPeriod)));
    } else {
      xTicksAxis = axisBottom(xDomain).ticks(this.histogramParams.xTicks).tickSize(this.minusSign * 4);
      xLabelsAxis = axisBottom(xDomain).tickSize(0).tickPadding(labelPadding).ticks(this.histogramParams.xLabels);
    }
    xAxis = axisBottom(xDomain).tickSize(0);

    data.forEach(swimlane => {
      const startRange = xDomain(swimlane[0].key);
      let endRange;
      let xDataDomain;
      stepWidth = xDomain(+swimlane[0].key + this.dataInterval) - xDomain(+swimlane[0].key);
      endRange = xDomain(+swimlane[swimlane.length - 1].key + this.dataInterval);
      xDataDomain = scaleBand().range([startRange, endRange]).paddingInner(0);
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
    for (let i = 0; i <= this.histogramParams.swimlaneData.stats.nbLanes; i++) {
      this.allAxesContext.append('g')
        .attr('class', 'histogram__line-separator')
        .attr('transform', 'translate(' + this.histogramParams.swimLaneLabelsWidth + ',' + this.histogramParams.swimlaneHeight * i + ')')
        .call(this.swimlaneAxes.xAxis);
    }
  }

  protected showTooltipsForSwimlane(swimlaneMapData: Map<string, Array<HistogramData>>, swimStats: SwimlaneStats,
    representation: SwimlaneRepresentation): void {
    this.histogramParams.swimlaneXTooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
    this.verticalTooltipLine = this.context.append('g').append('line').attr('class', 'histogram__swimlane--vertical-tooltip-line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', this.chartDimensions.height)
      .style('display', 'none');
    this.chartDimensions.svg
      .on('mousemove', () => {
        let i = 0;
        this.aBucketIsEncountred = false;
        const previousHoveredBucketKey = this.hoveredBucketKey;
        this.hoveredBucketKey = null;
        swimlaneMapData.forEach((swimlane, key) => {
          this.setTooltipPositionForSwimlane(swimlane, key, i, swimStats, representation, <ContainerElement>this.context.node());
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

  protected setTooltipPositionForSwimlane(data: Array<HistogramData>, key: string, indexOfKey: number, swimStats: SwimlaneStats,
    representation: SwimlaneRepresentation, container: ContainerElement): void {
    const xy = mouse(container);
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
          this.histogramParams.dataType, false, this.histogramParams.valuesDateFormat, this.dataInterval);

        tooltip.yContent = formatWithSpace(data[i].value);
        if (representation === SwimlaneRepresentation.column) {
          const sum = swimStats.columnStats.get(+data[i].key).sum;
          const percentage = (sum > 0 ) ? 100 * Math.round(data[i].value / sum * 1000) / 1000 : 0;
          tooltip.yAdditonalInfo = ' - ' + percentage + '%';
        }
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

  /**
   * returns a color in hex form (#abcdef)
   * @param bucket the bucket to be colorized
   * @param swimStats stats of the swimlane used to put `bucket` in the context of all the data
   * @param representation what information to represent:
   * - `column`: the bucket value is compared to other values of the same column (vertical lane)
   * - `global`: the bucket value is compated to all data.
   * @param colors Either a hex string color or a color name (in English) or a saturation interval.
   */
  protected getBucketColor(bucket: HistogramData, swimOptions: SwimlaneOptions, swimStats: SwimlaneStats,
    representation: SwimlaneRepresentation, colors: string | [number, number]): string {
     const columnStats: Map<number, LaneStats> = swimStats.columnStats;
     const globalMax = swimStats.globalStats.max;
     const bucketValue = bucket.value;
     if (bucketValue.toString() === NaN.toString()) {
       if (swimOptions && swimOptions.nan_color) {
         return swimOptions.nan_color;
       } else {
         return NAN_COLOR;
       }
     } else {
       let colorValue;
       /** calculates the value that will be transformed to a color */
       if (representation === SwimlaneRepresentation.global) {
         colorValue = globalMax === 0 ? 0 : +bucketValue / globalMax;
       } else {
         /** representation === SwimlaneRepresentation.column */
         const columnSum = swimStats.columnStats.get(+bucket.key).sum;
         colorValue = columnSum === 0 ? 0 : +bucketValue / columnStats.get(+bucket.key).sum;
       }
       /** for colorValue == 0; if `zeros_color` is specified, we return it otherwise we use the `colors` palette */
       if (colorValue === 0 && swimOptions && swimOptions.zeros_color) {
         return swimOptions.zeros_color;
       } else {
         return HistogramUtils.getColor(colorValue, colors).toHexString();
       }
     }
   }

  protected addLabels(swimlanesMapData: Map<string, Array<HistogramData>>): void {
    this.labelsContext = this.context.append('g').classed('swimlane-labels-container', true);
    let i = 0;
    this.labelsContextList = new Array<{name: string, context: any}>();
    this.labelsRectContextList = new Array<{name: string, context: any}>();
    swimlanesMapData.forEach( (swimlane, key) => {
      const labelRectContext  = this.labelsContext.append('rect')
        .attr('width', this.histogramParams.swimLaneLabelsWidth - 5)
        .attr('height', this.histogramParams.swimlaneHeight)
        .attr('fill', '#FFFFFF')
        .attr('transform', 'translate(0,' + (this.histogramParams.swimlaneHeight * (i)) + ')')
        .style('cursor', 'pointer');
        this.labelsRectContextList.push({name: key, context: labelRectContext});
      const labelContext = this.labelsContext.append('text')
        .text(function () { return key; })
        .style('cursor', 'pointer')
        .attr('transform', 'translate(3,' + (this.histogramParams.swimlaneHeight * (i + 4 / 7) +  this.histogramParams.margin.top) + ')');
        this.labelsContextList.push({name: key, context: labelContext});
      i++;
    });
    for (let j = 0; j < this.labelsContextList.length; j++) {
      this.labelsContextList[j].context.on('click', () => {
        this.setSelectedSwimlanes(this.labelsContextList[j]);
      });
      this.labelsContextList[j].context.on('mousemove', () => {
        this.labelsRectContextList[j].context.attr('class', 'swimlane-label-container-hovered');
      });
      this.labelsContextList[j].context.on('mouseout', () => {
        this.applyHoverStyleOnSwimlaneLabels(this.labelsRectContextList[j]);
      });
      this.labelsRectContextList[j].context.on('click', () => {
        this.setSelectedSwimlanes(this.labelsRectContextList[j]);
      });
      this.labelsRectContextList[j].context.on('mousemove', () => {
        this.labelsRectContextList[j].context.attr('class', 'swimlane-label-container-hovered');
      });
      this.labelsRectContextList[j].context.on('mouseout', () => {
        this.applyHoverStyleOnSwimlaneLabels(this.labelsRectContextList[j]);
      });
    }
  }

  protected setSwimlaneDataInterval(swimlaneData: Map<string, Array<HistogramData>>): void {
    this.dataInterval = this.getDataInterval(swimlaneData);
  }

  protected setDataInterval(swimlaneData: Map<string, Array<HistogramData>>): void {
  }

  protected getDataInterval(swimlaneData: Map<string, Array<HistogramData>>): number {
    let dataInterval: number;
    this.swimlaneHasMoreThanTwoBuckets = false;
    const keys = swimlaneData.keys();
    for (let i = 0; i < swimlaneData.size; i++) {
      const key = keys.next().value;
      if (swimlaneData.get(key).length > 1) {
        this.swimlaneHasMoreThanTwoBuckets = true;
        this.histogramParams.displaySvg = 'block';
        dataInterval =  (+swimlaneData.get(key)[1].key - +swimlaneData.get(key)[0].key);
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
      if (interval === Number.MAX_VALUE) {
        // IT MEANS THERE IS ONE BUCKET PER LANE AND THEY ALL HAVE THE SAME KEY
        if (this.histogramParams.dataType === DataType.time) {
          // we give 1min as a dataInterval in this case
          dataInterval = 60000;
        } else {
          // we give 1 as a dataInterval in this case
          dataInterval = 1;
        }
      } else {
        dataInterval = interval;
      }
    }
    return dataInterval;
  }

  protected setSelectedSwimlanes(labelContext: {name: string, context: any}): void {
    if (!this.histogramParams.selectedSwimlanes) {
      this.histogramParams.selectedSwimlanes = new Set<string>();
    }
    if (this.histogramParams.selectedSwimlanes.has(labelContext.name)) {
      this.histogramParams.selectedSwimlanes.delete(labelContext.name);
    } else {
      this.histogramParams.selectedSwimlanes.add(labelContext.name);
    }
    this.histogramParams.selectedSwimlanesEvent.next(this.histogramParams.selectedSwimlanes);
    this.applyStyleOnSwimlanes();
  }

  protected setSwimlaneMinMaxBorders(swimlaneStats: SwimlaneStats): void {
    const minInterval = swimlaneStats.minBorder;
    const maxInterval = swimlaneStats.maxBorder;
    const dataType = this.histogramParams.dataType;
    let bucketLength = 0;
    if (swimlaneStats.bucketLength !== undefined) {
      bucketLength = swimlaneStats.bucketLength;
    } else {
      if (dataType === DataType.time) {
        /** we give 1 min as a bucketlength in this case */
        bucketLength = 60000;
      } else {
        /** we give 1 as a dataInterval in this case */
        bucketLength = 1;
      }
    }
    this.swimlaneIntervalBorders = (dataType === DataType.time) ?
     [(new Date(minInterval)), new Date(maxInterval + bucketLength)] : [minInterval, maxInterval + bucketLength];
  }

  protected getHistogramMinMaxBorders(data: Array<HistogramData>): [number | Date, number | Date] {
    return this.swimlaneIntervalBorders;
  }

  protected getAxes() {
    return this.swimlaneAxes;
  }

  protected abstract plotOneLane(data: Array<HistogramData>, indexOfLane: number): void;

}
