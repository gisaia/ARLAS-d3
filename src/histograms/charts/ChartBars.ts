import * as d3 from 'd3';

import { HistogramData, HistogramUtils, ChartAxes, DataType } from '../utils/HistogramUtils';
import { AbstractChart } from './AbstractChart';


export class ChartBars extends AbstractChart {

  public plot(inputData: Array<{ key: number, value: number }>) {
    super.plot(inputData);
  }

  public resize(): void {
    super.resize();
    this.plot(<Array<{ key: number, value: number }>>this.histogramParams.data);
    if (this.histogramParams.multiselectable) {
      this.resizeSelectedIntervals(this.chartAxes);
    }
  }

  protected plotChart(data: Array<HistogramData>): void {
    this.plotBars(data, this.chartAxes, this.chartAxes.xDataDomain);
    this.barsContext
      .attr('y', (d) =>  this.chartAxes.yDomain(d.value))
      .attr('height', (d) => this.chartDimensions.height - this.chartAxes.yDomain(d.value));
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
    this.chartAxes.xDataDomain = d3.scaleBand().range([startRange, endRange]).paddingInner(0);
    this.chartAxes.xDataDomain.domain(data.map((d) => d.key));
    const ticksPeriod = Math.max(1, Math.round(data.length / this.histogramParams.xTicks));
    const labelsPeriod = Math.max(1, Math.round(data.length / this.histogramParams.xLabels));
    if (this.histogramParams.dataType === DataType.numeric) {
      this.chartAxes.xTicksAxis = d3.axisBottom(this.chartAxes.xDomain).tickPadding(5).tickValues(this.chartAxes.xDataDomain.domain()
        .filter((d, i) => !(i % ticksPeriod))).tickSize(this.minusSign * 5);
      this.chartAxes.xLabelsAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0).tickPadding(this.minusSign * 12)
      .tickValues(this.chartAxes.xDataDomain.domain()
        .filter((d, i) => !(i % labelsPeriod)));
    } else {
      this.chartAxes.xTicksAxis = d3.axisBottom(this.chartAxes.xDomain).ticks(this.histogramParams.xTicks).tickSize(this.minusSign * 5);
      this.chartAxes.xLabelsAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0).tickPadding(this.minusSign * 12)
      .ticks(this.histogramParams.xLabels);
    }
    this.chartAxes.xAxis = d3.axisBottom(this.chartAxes.xDomain).tickSize(0);
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

  protected applyStyleOnSelection() {
    this.applyStyleOnSelectedBars(this.barsContext);
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

  protected setDataInterval(data: Array<HistogramData>): void {
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
    this.dataInterval = interval;
  }

}
