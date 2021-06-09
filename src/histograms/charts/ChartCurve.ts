import { curveLinear, CurveFactory, line, curveMonotoneX } from 'd3-shape';
import { min, max, extent } from 'd3-array';

import { ChartAxes, DataType, HistogramData, HistogramUtils, Position, tickNumberFormat } from '../utils/HistogramUtils';
import { AbstractChart } from './AbstractChart';
import { axisBottom } from 'd3-axis';
import { timeFormat, utcFormat } from 'd3-time-format';


export class ChartCurve extends AbstractChart {
    public clipPathContexts = [];
    public currentClipPathContexts = [];
    public rectangleCurrentClippers = [];
    public plot(inputData: HistogramData[]): void {
        super.init();
        this.dataDomain = inputData;
        if (inputData !== null && Array.isArray(inputData) && inputData.length > 0) {
            const movedData = this.moveDataByHalfInterval(inputData);
            const data = HistogramUtils.parseDataKey(movedData, this.histogramParams.dataType);
            const chartIdToData = new Map<string, HistogramData[]>();
            // Reduce data by charId
            const chartIds = new Set(data.map(item => item.chartId));
            // Put each data by chartId in a map
            chartIds.forEach(id => chartIdToData.set(id, data.filter(d => d.chartId === id)));
            // If the map is empty, add a default key with the unique chart data
            if (chartIdToData.size === 0) {
                chartIdToData.set('default', data);
            }
            if (chartIdToData.size === 1) {
                // We add just one Y axis
                // No normalization
            } else if (chartIdToData.size === 2) {
                // We add on Y axis on right
                // We add on Y axis on left
                // No normalization
            } else {
                // No Y axis
                // We normalize the data
            }
            const dataArray = Array.from(chartIdToData.values());
            const dataArrayMerged: HistogramData[] = [].concat.apply([], dataArray);
            const minMaxBorders = dataArray.map(d => this.getHistogramMinMaxBorders(d));
            const minOfMin = min(minMaxBorders.map(d => d[0]));
            const maxOfMax = max(minMaxBorders.map(d => d[1]));

            this.histogramParams.dataLength = (new Set(dataArrayMerged.map(d => d.key))).size;

            this.initializeDescriptionValues(minOfMin, maxOfMax, dataArray[0]);
            this.initializeChartDimensions();

            // merge all the data
            this.createChartAxes(dataArrayMerged);
            this.drawChartAxes(this.chartAxes, 0);

            dataArray.map(d => this.plotChart(d));


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
    protected onSelectionClick(): void {
        this.brushContext.on('click', () => {
            if (!this.isBrushed && this.rectangleCurrentClipper !== null) {
                this.rectangleCurrentClipper.remove();
                this.rectangleCurrentClipper = null;
            }
        });
    }
    protected addSelectionBrush(chartAxes: ChartAxes, leftOffset: number): void {
        super.addSelectionBrush(chartAxes, leftOffset);
        this.applyStyleOnSelection();
        this.onSelectionClick();
        if (this.histogramParams.multiselectable) {
            this.onSelectionDoubleClick(chartAxes);
        }
    }

    protected createChartAxes(data: Array<HistogramData>): void {
        super.createChartAxes(data);
        this.chartAxes.stepWidth = 0;
        const startRange = this.chartAxes.xDomain(data[0].key);
        const endRange = this.chartAxes.xDomain(+data[data.length - 1].key);
        const xDataDomain = (this.getXDomainScale()).range([startRange, endRange]);
        xDataDomain.domain(extent(data, (d: any) => d.key));
        this.chartAxes.xDataDomain = xDataDomain;
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
    }

    protected drawChartAxes(chartAxes: ChartAxes, leftOffset: number): void {
        super.drawChartAxes(chartAxes, leftOffset);
        this.drawYAxis(chartAxes);
    }


    protected plotChart(data: Array<HistogramData>): void {
        console.log(data);
        const clipPathContext = this.context.append('defs').append('clipPath')
            .attr('id', this.histogramParams.uid);
        this.clipPathContexts.push(clipPathContext);
        const currentClipPathContext = this.context.append('defs').append('clipPath')
            .attr('id', this.histogramParams.uid + '-currentselection');
        this.currentClipPathContexts.push(currentClipPathContext);

        const rectangleCurrentClipper = currentClipPathContext.append('rect')
            .attr('id', 'clip-rect')
            .attr('x', this.chartAxes.xDomain(this.selectionInterval.startvalue))
            .attr('y', '0')
            .attr('width', this.chartAxes.xDomain(this.selectionInterval.endvalue) - this.chartAxes
                .xDomain(this.selectionInterval.startvalue))
            .attr('height', this.chartDimensions.height);


        this.rectangleCurrentClippers.push(rectangleCurrentClipper);
        const curveType: CurveFactory = (this.histogramParams.isSmoothedCurve) ? curveMonotoneX : curveLinear;

        const a = line()
            .curve(curveType)
            .x((d: any) => this.chartAxes.xDataDomain(d.key))
            .y((d: any) => this.chartAxes.yDomain(d.value));

        const urlFixedSelection = 'url(#' + this.histogramParams.uid + ')';
        const urlCurrentSelection = 'url(#' + this.histogramParams.uid + '-currentselection)';
        const discontinuedData = HistogramUtils.splitData(data);
        discontinuedData[0].forEach(part => {
            this.context.append('g').attr('class', 'histogram__curve-data')
                .append('path')
                .datum(part)
                .attr('class', 'histogram__chart--unselected--curve')
                .style('stroke', (d) => 'black')
                .style('opacity', 1)
                .attr('d', a);
            this.context.append('g').attr('class', 'histogram__curve-data').attr('clip-path', urlFixedSelection)
                .append('path')
                .datum(part)
                .attr('class', 'histogram__chart--fixed-selected--curve')
                .style('stroke', (d) => 'blue')
                .style('opacity', 1)
                .attr('d', a);
            this.context.append('g').attr('class', 'histogram__curve-data').attr('clip-path', urlCurrentSelection)
                .append('path')
                .datum(part)
                .attr('class', 'histogram__chart--current-selected--curve')
                .style('stroke', (d) => 'blue')
                .style('opacity', 1)
                .attr('d', a);
        });
        this.addStrippedPattern('no-data-stripes', this.NO_DATA_STRIPES_PATTERN, this.NO_DATA_STRIPES_SIZE, 'histogram__no-data-stripes');
        discontinuedData[1].forEach(part => {
            this.context.append('g')
                .append('rect')
                .attr('x', this.chartAxes.xDomain(part[0].key))
                .attr('y', 0)
                .attr('width', this.chartAxes.xDomain(part[part.length - 1].key) - this.chartAxes.xDomain(part[0].key))
                .attr('height', this.chartDimensions.height)
                .attr('fill', 'url(#no-data-stripes)')
                .attr('fill-opacity', 0.5);
        });
    }

    protected getAppendedRectangle(start: Date | number, end: Date | number): any {
        return this.clipPathContexts[0].append('rect')
            .attr('id', 'clip-rect')
            .attr('x', this.chartAxes.xDomain(start))
            .attr('y', '0')
            .attr('width', this.chartAxes.xDomain(end) - this.chartAxes.xDomain(start))
            .attr('height', this.chartDimensions.height);
    }

    protected applyStyleOnSelection(): void {
        this.rectangleCurrentClippers.forEach(r => {
            r.attr('x', this.chartAxes.xDomain(this.selectionInterval.startvalue))
                .attr('width', this.chartAxes.xDomain(this.selectionInterval.endvalue) -
                    this.chartAxes.xDomain(this.selectionInterval.startvalue));
        });
    }
    protected getStartPosition(data: Array<HistogramData>, index: number): number {
        return this.chartAxes.xDomain(data[index].key) - 10;
    }
    protected getEndPosition(data: Array<HistogramData>, index: number): number {
        return this.chartAxes.xDomain(data[index].key) + 10;
    }
    protected setTooltipXposition(xPosition: number): number {
        // Deprecated method
        return 0;
    }
    protected setTooltipYposition(yPosition: number): number {
        // Deprecated method
        return 0;
    }
}
