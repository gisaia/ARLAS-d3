import { AbstractHistogram } from '../AbstractHistogram';
import { HistogramData, HistogramUtils, ChartAxes } from '../utils/HistogramUtils';
import * as d3 from 'd3';


export abstract class AbstractChart extends AbstractHistogram {

  protected chartAxes: ChartAxes;

  public plot(inputData: Array<{ key: number, value: number }>) {
    super.plot(inputData);
    this.dataDomain = inputData;
    if (inputData !== null && Array.isArray(inputData) && inputData.length > 0) {
      const data = HistogramUtils.parseDataKey(inputData, this.histogramParams.dataType);
      this.histogramParams.dataLength = data.length;
      this.initializeDescriptionValues(data[0].key, data[data.length - 1].key);
      this.initializeChartDimensions();
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
    }
  }

  public resize(): void {
    if (this.isWidthFixed === false) {
      this.histogramParams.chartWidth = this.histogramParams.el.nativeElement.childNodes[0].offsetWidth;
    }

    if (this.isHeightFixed === false) {
      this.histogramParams.chartHeight = this.histogramParams.el.nativeElement.childNodes[0].offsetHeight;
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

  protected initializeChartDimensions(): void {
    super.initializeChartDimensions();
    if (this.histogramParams.dataLength > 1) {
      this.histogramParams.displaySvg = 'block';
    } else {
      this.histogramParams.displaySvg = 'none';
    }
    this.initializeChartHeight();
    const svg = d3.select(this.histogramParams.histogramNode).select('svg');
    const margin = this.histogramParams.margin;
    const width = Math.max(+this.histogramParams.chartWidth - this.histogramParams.margin.left - this.histogramParams.margin.right, 0);
    const height = Math.max(+this.histogramParams.chartHeight - this.histogramParams.margin.top - this.histogramParams.margin.bottom, 0);
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

    const yDomain = d3.scaleLinear().range([this.chartDimensions.height, 0]);
    yDomain.domain([0, d3.max(data, (d: any) => d.value)]);
    const yTicksAxis = d3.axisLeft(yDomain).ticks(this.histogramParams.yTicks);
    const yLabelsAxis = d3.axisLeft(yDomain).tickSize(0).tickPadding(10).ticks(this.histogramParams.yLabels);
    this.chartAxes = { xDomain, xDataDomain, yDomain, xTicksAxis, yTicksAxis, stepWidth, xLabelsAxis, yLabelsAxis, xAxis };
  }

  protected drawYAxis(chartAxes: ChartAxes): void {
    this.yTicksAxis = this.allAxesContext.append('g')
    .attr('class', 'histogram__ticks-axis')
    .call(chartAxes.yTicksAxis);
    this.yLabelsAxis = this.allAxesContext.append('g')
      .attr('class', 'histogram__labels-axis')
      .call(chartAxes.yLabelsAxis);
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
            this.histogramParams.tooltip.xContent = HistogramUtils.toString(data[i].key,
              this.histogramParams.chartType, this.histogramParams.dataType, this.histogramParams.valuesDateFormat);
            this.histogramParams.tooltip.yContent = data[i].value.toString();
          }
        } else {
          this.histogramParams.tooltip.xContent = HistogramUtils.toString(data[i].key,
            this.histogramParams.chartType, this.histogramParams.dataType, this.histogramParams.valuesDateFormat);
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


  protected getAxes() {
    return this.chartAxes;
  }

  protected abstract plotChart(data: Array<HistogramData>): void;
  protected abstract getStartPosition(data: Array<HistogramData>, index: number): number;
  protected abstract getEndPosition(data: Array<HistogramData>, index: number): number;
  protected abstract setTooltipXposition(xPosition: number): number;
  protected abstract setTooltipYposition(yPosition: number): number;

}
