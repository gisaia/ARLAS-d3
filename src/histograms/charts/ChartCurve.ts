import { curveLinear, CurveFactory, line, curveMonotoneX } from 'd3-shape';
import { min, max, extent } from 'd3-array';

import { ChartAxes, DataType, HistogramData, HistogramUtils, Position, tickNumberFormat } from '../utils/HistogramUtils';
import { AbstractChart } from './AbstractChart';
import { axisBottom, axisLeft, axisRight } from 'd3-axis';
import { timeFormat, utcFormat } from 'd3-time-format';
import { scaleLinear } from 'd3-scale';
import { format } from 'd3-format';



export class ChartCurve extends AbstractChart {
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
            const chartIdsToSides = new Map();
            let i = 0;
            const dataArray = [];
            chartIdToData.forEach((values, id) => {
                if (chartIdToData.size === 2) {
                    if (i === 0) {
                        chartIdsToSides.set(id, 'left');
                    } else {
                        chartIdsToSides.set(id, 'right');
                    }
                    i++;
                } else {
                    chartIdsToSides.set(id, 'left');
                }
                dataArray.push(values);
            });
            const dataArrayMerged: HistogramData[] = [].concat.apply([], dataArray);
            const minMaxBorders = dataArray.map(d => this.getHistogramMinMaxBorders(d));
            const minOfMin = min(minMaxBorders.map(d => d[0]));
            const maxOfMax = max(minMaxBorders.map(d => d[1]));
            this.histogramParams.dataLength = (new Set(dataArrayMerged.map(d => d.key))).size;
            this.initializeDescriptionValues(minOfMin, maxOfMax, dataArray[0]);
            this.initializeChartDimensions();
            if (chartIdToData.size === 1) {
                // We add just one Y axis on the left
                // No normalization
                this.createChartXAxes(dataArrayMerged);
                this.createChartYLeftAxes(dataArrayMerged);
                this.drawChartAxes(this.chartAxes, 0);
                this.drawYAxis(this.chartAxes, 'left');
                this.createClipperContext();
                dataArray.map(d => this.plotChart(d));
            } else if (chartIdToData.size === 2) {
                // We add on Y axis on right
                // We add on Y axis on left
                // No normalization
                this.createChartXAxes(dataArrayMerged);
                this.createChartYLeftAxes(dataArray[0]);
                this.createChartYRightAxes(dataArray[1]);
                this.drawChartAxes(this.chartAxes, 0);
                this.drawYAxis(this.chartAxes, 'left');
                this.drawYAxis(this.chartAxes, 'right');
                this.createClipperContext();
                this.plotChart(dataArray[0], this.chartAxes.yDomain);
                this.plotChart(dataArray[1], this.chartAxes.yDomainRight);

            } else {
                // No Y axis
                // We normalize the data
                this.createChartXAxes(dataArrayMerged);
                this.createChartNormalizeLeftAxes();
                this.drawChartAxes(this.chartAxes, 0);
                this.createClipperContext();
                dataArray.forEach(chartData => {
                    const minus = min(chartData.map(d => d.value));
                    const maxus = max(chartData.map(d => d.value));
                    chartData.forEach(d => {
                        d.normalizeValue = this.normalize(d.value, minus, maxus);
                    });
                });
                dataArray.map(d => this.plotChart(d, this.chartAxes.yDomain, true));
            }
            this.showTooltips(data, chartIdsToSides);
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

    protected createNormalizeYDomain() {
        const yDomain = scaleLinear().range([this.chartDimensions.height, 0]);
        yDomain.domain([0, 1]);
        return yDomain;
    }

    /**
   * @override For areas charts, removes the line behind the hovered bucket of the histogram + removes the circle on the hovered bucket
   */
    protected clearTooltipCursor(): void {
        this.tooltipCursorContext.selectAll('line').remove();
        this.context.selectAll('g.histogram__area_circle_container').remove();
    }

    protected drawTooltipCursor(data: Array<HistogramData>, axes: ChartAxes, chartIsToSides?: Map<string, string>) {
        this.tooltipCursorContext.selectAll('.bar')
            .data([data[0]].filter(d => this.isValueValid(d)))
            .enter().append('line')
            .attr('x1', (d) => axes.xDataDomain(d.key))
            .attr('x2', (d) => axes.xDataDomain(d.key))
            .attr('y1', 1)
            .attr('y2', (d) => this.chartDimensions.height)
            .attr('class', 'histogram__tooltip_cursor_line');
        this.context.append('g').attr('class', 'histogram__area_circle_container')
            .selectAll('dot').data(data.filter(d => this.isValueValid(d)))
            .enter().append('circle')
            .attr('r', (d) => 3)
            .attr('cx', (d) => axes.xDataDomain(d.key))
            .attr('cy', (d) => {
                if (chartIsToSides.size === 2 && chartIsToSides.get(d.chartId) === 'right') {
                    return axes.yDomainRight(d.value);
                } else if (chartIsToSides.size > 2) {
                    return axes.yDomain(d.normalizeValue);
                } else {
                    return axes.yDomain(d.value);
                }
            })
            .attr('class', (d) => {
                if (!!d.chartId && !!this.histogramParams.colorGenerator && !!this.histogramParams.colorGenerator.getColor(d.chartId)) {
                    return 'histogram__area_circle-without_color';
                } else {
                    return 'histogram__area_circle';
                }
            })
            .attr('fill', (d) => {
                if (!!d.chartId && !!this.histogramParams.colorGenerator && !!this.histogramParams.colorGenerator.getColor(d.chartId)) {
                    return this.histogramParams.colorGenerator.getColor(d.chartId);
                } else {
                    return 'none';
                }
            })
            .style('opacity', '0.8');

    }

    protected createYDomain(data: Array<HistogramData>) {
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
                // IF `showStripes == TRUE` THEN STRIPES WILL OCCUPY 10% OF
                // THE CHARTHEIGHT AND THE DATA VARIATION WILL OCCUPY 90% OF THE CHART
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
        return yDomain;
    }

    protected createChartNormalizeLeftAxes() {
        const yDomain = this.createNormalizeYDomain();
        const yAllDomain = yDomain;
        const yTicksAxis = axisLeft(yDomain).ticks(this.histogramParams.yTicks).tickSizeOuter(0);
        const yLabelsAxis = axisLeft(yDomain).tickSize(0).tickPadding(10).ticks(this.histogramParams.yLabels)
            .tickFormat(d => !this.histogramParams.shortYLabels ?
                tickNumberFormat(d, this.histogramParams.numberFormatChar) : format('~s')(d));
        const yAxis = axisLeft(yAllDomain).tickSize(0).ticks(0);
        this.chartAxes.yDomain = yDomain;
        this.chartAxes.yTicksAxis = yTicksAxis;
        this.chartAxes.yLabelsAxis = yLabelsAxis;
        this.chartAxes.yAxis = yAxis;
    }

    protected createChartYLeftAxes(data: Array<HistogramData>) {
        const yDomain = this.createYDomain(data);
        const yAllDomain = yDomain;
        const yTicksAxis = axisLeft(yDomain).ticks(this.histogramParams.yTicks).tickSizeOuter(0);
        const yLabelsAxis = axisLeft(yDomain).tickSize(0).tickPadding(10).ticks(this.histogramParams.yLabels)
            .tickFormat(d => !this.histogramParams.shortYLabels ?
                tickNumberFormat(d, this.histogramParams.numberFormatChar) : format('~s')(d));
        const yAxis = axisLeft(yAllDomain).tickSize(0).ticks(0);
        this.chartAxes.yDomain = yDomain;
        this.chartAxes.yTicksAxis = yTicksAxis;
        this.chartAxes.yLabelsAxis = yLabelsAxis;
        this.chartAxes.yAxis = yAxis;
    }

    protected createChartYRightAxes(data: Array<HistogramData>) {
        const yDomain = this.createYDomain(data);
        const yAllDomain = yDomain;
        const yTicksAxis = axisRight(yDomain).ticks(this.histogramParams.yTicks).tickSizeOuter(0);
        const yLabelsAxis = axisRight(yDomain).tickSize(0).tickPadding(10).ticks(this.histogramParams.yLabels)
            .tickFormat(d => !this.histogramParams.shortYLabels ?
                tickNumberFormat(d, this.histogramParams.numberFormatChar) : format('~s')(d));
        const yAxis = axisLeft(yAllDomain).tickSize(0).ticks(0);
        this.chartAxes.yDomainRight = yDomain;
        this.chartAxes.yTicksAxisRight = yTicksAxis;
        this.chartAxes.yLabelsAxisRight = yLabelsAxis;
        this.chartAxes.yAxisRight = yAxis;
    }

    protected createChartXAxes(data: Array<HistogramData>): void {
        const xDomain = (this.getXDomainScale()).range([0, this.chartDimensions.width]);
        // The xDomain extent includes data domain and selected values
        const xDomainExtent = this.getXDomainExtent(data, this.selectionInterval.startvalue,
            this.selectionInterval.endvalue);
        xDomain.domain(xDomainExtent);
        // xDataDomain includes data domain only
        const xAxis = null;
        const xTicksAxis = null;
        const xLabelsAxis = null;
        const stepWidth = null;
        this.chartAxes = {
            xDomain, xDataDomain: undefined, yDomain: undefined, xTicksAxis,
            yTicksAxis: undefined, stepWidth, xLabelsAxis, yLabelsAxis: undefined, xAxis, yAxis: undefined
        };
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
    }


    protected plotChart(data: Array<HistogramData>, domain?: any, normalize?: boolean): void {
        const chartId = data[0].chartId;
        if (!domain) {
            domain = this.chartAxes.yDomain;
        }
        let retrieveData = (d: any) => domain(d.value);
        if (normalize) {
            retrieveData = (d: any) => domain(d.normalizeValue);
        }
        const curveType: CurveFactory = (this.histogramParams.isSmoothedCurve) ? curveMonotoneX : curveLinear;

        const a = line()
            .curve(curveType)
            .x((d: any) => this.chartAxes.xDataDomain(d.key))
            .y(retrieveData);

        const urlFixedSelection = 'url(#' + this.histogramParams.uid + ')';
        const urlCurrentSelection = 'url(#' + this.histogramParams.uid + '-currentselection)';
        const discontinuedData = HistogramUtils.splitData(data);
        discontinuedData[0].forEach(part => {
            this.context.append('g').attr('class', 'histogram__curve-data')
                .append('path')
                .datum(part)
                .attr('class', 'histogram__chart--unselected--curve')
                .style('opacity', 1)
                .attr('d', a);
            const fixedSelectionCurve = this.context.append('g').attr('class', 'histogram__curve-data').attr('clip-path', urlFixedSelection)
                .append('path')
                .datum(part)
                .attr('class', 'histogram__chart--fixed-selected--curve')
                .style('opacity', 1)
                .attr('d', a);
            const currentSelectionCurve = this.context.append('g').attr('class', 'histogram__curve-data')
                .attr('clip-path', urlCurrentSelection)
                .append('path')
                .datum(part)
                .attr('class', 'histogram__chart--current-selected--curve')
                .style('opacity', 1)
                .attr('d', a);
            if (!!chartId && !!this.histogramParams.colorGenerator && !!this.histogramParams.colorGenerator.getColor(chartId)) {
                fixedSelectionCurve.attr('stroke', this.histogramParams.colorGenerator.getColor(chartId))
                    .attr('class', 'histogram__chart--fixed-selected--curve--without_color');
                currentSelectionCurve.attr('stroke', this.histogramParams.colorGenerator.getColor(chartId))
                    .attr('class', 'histogram__chart--current-selected--curve--without_color');
            } else {
                fixedSelectionCurve.attr('class', 'histogram__chart--fixed-selected--curve');
                currentSelectionCurve.attr('class', 'histogram__chart--current-selected--curve');
            }
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



    protected applyStyleOnSelection(): void {
        this.applyStyleOnClipper();
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

    private normalize(x, xMin, xMax) {
        return (x - xMin) / (xMax - xMin);
    }

    private createClipperContext() {
        this.clipPathContext = this.context.append('defs').append('clipPath')
            .attr('id', this.histogramParams.uid);
        this.currentClipPathContext = this.context.append('defs').append('clipPath')
            .attr('id', this.histogramParams.uid + '-currentselection');
        this.rectangleCurrentClipper = this.currentClipPathContext.append('rect')
            .attr('id', 'clip-rect')
            .attr('x', this.chartAxes.xDomain(this.selectionInterval.startvalue))
            .attr('y', '0')
            .attr('width', this.chartAxes.xDomain(this.selectionInterval.endvalue) - this.chartAxes
                .xDomain(this.selectionInterval.startvalue))
            .attr('height', this.chartDimensions.height);
    }
}
