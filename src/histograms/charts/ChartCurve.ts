import { curveLinear, CurveFactory, line, curveMonotoneX } from 'd3-shape';
import { min, max } from 'd3-array';

import { ChartAxes, HistogramData, HistogramUtils, tickNumberFormat } from '../utils/HistogramUtils';
import { AbstractChart } from './AbstractChart';
import { axisLeft, axisRight } from 'd3-axis';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import { format } from 'd3-format';
import { SelectionType } from '../HistogramParams';



export class ChartCurve extends AbstractChart {

    /** Replots the chart with new dimensions + repositionates selected areas correctly */
    public resize(histogramContainer: HTMLElement): void {
        super.resize(histogramContainer);
        this.plot(this.histogramParams.histogramData);
        if (this.histogramParams.multiselectable) {
          this.resizeSelectedIntervals(this.chartAxes);
        }
    }

    public plot(inputData: HistogramData[]): void {
        super.init();
        this.dataDomain = inputData;
        if (inputData !== null && Array.isArray(inputData) && inputData.length > 0) {
            const movedData = this.moveDataByHalfInterval(inputData);
            const data = HistogramUtils.parseDataKey(movedData, this.histogramParams.dataType);
            this.histogramParams.bucketRange = this.getDataInterval(data);
            this.histogramParams.bucketInterval = this.getbucketInterval(this.histogramParams.bucketRange, this.histogramParams.dataType);
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
            const dataArray: Array<Array<HistogramData>> = [];
            chartIdToData.forEach((values, id) => {
                if (chartIdToData.size === 2) {
                    /** always put main chart id axis to the left */
                    if (chartIds.has(this.histogramParams.mainChartId)) {
                        if (id === this.histogramParams.mainChartId) {
                            chartIdsToSides.set(id, 'left');
                        } else {
                            chartIdsToSides.set(id, 'right');
                        }
                    } else {
                        if (i === 0) {
                            chartIdsToSides.set(id, 'left');
                        } else {
                            chartIdsToSides.set(id, 'right');
                        }
                        i++;
                    }

                } else {
                    chartIdsToSides.set(id, 'left');
                }
                /** add only values of charts idsthat are different from mainId */
                if ((!!this.histogramParams.mainChartId && id !== this.histogramParams.mainChartId) || !this.histogramParams.mainChartId) {
                    dataArray.push(values);
                }
            });
            /** add main chartId */
            if (!!this.histogramParams.mainChartId && chartIdToData.has(this.histogramParams.mainChartId)) {
                dataArray.push(chartIdToData.get(this.histogramParams.mainChartId));
            }
            const minMaxBorders = dataArray.map(d => this.getHistogramMinMaxBorders(d));
            const minOfMin = min(minMaxBorders.map(d => d[0]));
            const maxOfMax = max(minMaxBorders.map(d => d[1]));
            this.histogramParams.dataLength = (new Set(data.map(d => d.key))).size;
            this.initializeDescriptionValues(minOfMin, maxOfMax, this.histogramParams.bucketRange);
            /** add margin to right to show 2nd y axis */
            if (chartIdToData.size === 1) {
                this.histogramParams.margin.right = 10;
                this.histogramParams.margin.left = 60;
            } else if (chartIdToData.size === 2) {
                this.histogramParams.margin.right = 60;
                this.histogramParams.margin.left = 60;
            } else if (chartIdToData.size > 2) {
                /** reduce left/right margins when no y labels are shown */
                this.histogramParams.margin.left = 10;
                this.histogramParams.margin.right = 10;
            }
            this.initializeChartDimensions();
            if (chartIdToData.size === 1) {
                // We add just one Y axis on the left
                // No normalization
                this.createChartXAxes(data);
                this.createChartYLeftAxes(data);
                this.drawChartAxes(this.chartAxes, 0);
                this.drawYAxis(this.chartAxes, chartIdsToSides, Array.from(chartIds)[0]);
                this.createClipperContext();
                dataArray.map(d => this.plotChart(d));
            } else if (chartIdToData.size === 2) {
                // We add on Y axis on right
                // We add on Y axis on left
                // No normalization
                this.createChartXAxes(data);
                if (!!this.histogramParams.mainChartId && chartIdToData.has(this.histogramParams.mainChartId)) {
                    this.createChartYRightAxes(dataArray[0]);
                    this.createChartYLeftAxes(dataArray[1]);
                } else {
                    this.createChartYRightAxes(dataArray[1]);
                    this.createChartYLeftAxes(dataArray[0]);
                }
                this.drawChartAxes(this.chartAxes, 0);
                const chartIdsArray = Array.from(chartIds);
                if (!!this.histogramParams.mainChartId && chartIdToData.has(this.histogramParams.mainChartId)) {
                    this.drawYAxis(this.chartAxes, chartIdsToSides, this.histogramParams.mainChartId);
                    this.drawYAxis(this.chartAxes, chartIdsToSides, chartIdsArray.find(id => id !== this.histogramParams.mainChartId));
                } else {
                    this.drawYAxis(this.chartAxes, chartIdsToSides, chartIdsArray[0]);
                    this.drawYAxis(this.chartAxes, chartIdsToSides, chartIdsArray[1]);
                }

                this.createClipperContext();
                if (!!this.histogramParams.mainChartId && chartIdToData.has(this.histogramParams.mainChartId)) {
                    this.plotChart(dataArray[0], this.chartAxes.yDomainRight);
                    this.plotChart(dataArray[1], this.chartAxes.yDomain);
                } else {
                    this.plotChart(dataArray[0], this.chartAxes.yDomain);
                    this.plotChart(dataArray[1], this.chartAxes.yDomainRight);
                }

            } else {
                // No Y axis
                // We normalize the data
                this.createChartXAxes(data);
                this.createChartNormalizeLeftAxes();
                this.drawChartAxes(this.chartAxes, 0);
                this.createClipperContext();
                dataArray.forEach(chartData => {
                    const minimum = min(chartData.map(d => d.value));
                    const maximum = max(chartData.map(d => d.value));
                    if (minimum === maximum) {
                        /** all the values are the same ==> normalizedValue === 1 */
                        chartData.forEach(d => {
                            d.normalizeValue = 1;
                        });
                    } else {
                        chartData.forEach(d => {
                            d.normalizeValue = this.normalize(d.value, minimum, maximum);
                        });
                    }
                });
                dataArray.map(d => this.plotChart(d, this.chartAxes.yDomain, true));
            }
            this.showTooltips(data, chartIdsToSides);
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
    protected onSelectionClick(): void {
        this.brush.brushContext.on('click', () => {
            if (!this.brush.isBrushed && this.rectangleCurrentClipper !== null) {
                this.rectangleCurrentClipper.remove();
                this.rectangleCurrentClipper = null;
            }
        });
    }
    protected addSelectionBrush(selectionType: SelectionType, chartAxes: ChartAxes, leftOffset: number): void {
        super.addSelectionBrush(selectionType, chartAxes, leftOffset);
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
            .data(data.filter(d => this.isValueValid(d)))
            .enter().append('line')
            .attr('x1', (d) => axes.xDataDomain((+d.key).toString()))
            .attr('x2', (d) => axes.xDataDomain((+d.key).toString()))
            .attr('y1', 1)
            .attr('y2', () => this.chartDimensions.height)
            .attr('class', 'histogram__tooltip_cursor_line');
        this.context.append('g').attr('class', 'histogram__area_circle_container')
            .selectAll('dot').data(data.filter(d => this.isValueValid(d)))
            .enter().append('circle')
            .attr('r', () => 3)
            .attr('cx', (d) => axes.xDataDomain((+d.key).toString()))
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

    protected drawChartAxes(chartAxes: ChartAxes, leftOffset: number): void {
        super.drawChartAxes(chartAxes, leftOffset);
    }


    protected plotChart(data: Array<HistogramData>, domain?: ScaleLinear<number, number>, normalize?: boolean): void {
        const chartId = data[0].chartId;
        if (!domain) {
            domain = this.chartAxes.yDomain;
        }
        let retrieveData = (d: HistogramData) => domain(d.value);
        if (normalize) {
            retrieveData = (d: HistogramData) => domain(d.normalizeValue);
        }
        const urlFixedSelection = 'url(#' + this.histogramParams.uid + ')';
        const urlCurrentSelection = 'url(#' + this.histogramParams.uid + '-cs-curve)';
        const discontinuedData = HistogramUtils.splitData(data);
        if (!!data && data.length > 1) {
            const curveType: CurveFactory = (this.histogramParams.isSmoothedCurve) ? curveMonotoneX : curveLinear;
            const a = line<HistogramData>()
                .curve(curveType)
                .x(d => this.chartAxes.xDataDomain((+d.key).toString()))
                .y(retrieveData);
            discontinuedData[0].forEach(part => {
                this.context.append('g').attr('class', 'histogram__curve-data')
                    .append('path')
                    .datum(part)
                    .attr('class', 'histogram__chart--unselected--curve')
                    .style('opacity', 1)
                    .attr('d', a);
                const fixedSelectionCurve = this.context.append('g').attr('class', 'histogram__curve-data')
                    .attr('clip-path', urlFixedSelection)
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
                        .attr('stroke-width', chartId === this.histogramParams.mainChartId ? '2.3px' : '1.1px')
                        .attr('class', 'histogram__chart--fixed-selected--curve--without_color');
                    currentSelectionCurve.attr('stroke', this.histogramParams.colorGenerator.getColor(chartId))
                        .attr('stroke-width', chartId === this.histogramParams.mainChartId ? '2.3px' : '1.1px')
                        .attr('class', 'histogram__chart--current-selected--curve--without_color');
                } else {
                    fixedSelectionCurve.attr('class', 'histogram__chart--fixed-selected--curve');
                    currentSelectionCurve.attr('class', 'histogram__chart--current-selected--curve');
                }
            });
        } else if (!!data && data.length === 1) {
            this.context.append('g')
                .attr('class', 'histogram__curve-data')
                .selectAll('dot').data(data).enter().append('circle')
                .attr('r', chartId === this.histogramParams.mainChartId ? 2 : 4)
                .attr('cx', (d) => this.chartAxes.xDataDomain((+d.key).toString()))
                .attr('cy', retrieveData)
                .attr('class', 'histogram__chart--unselected--curve')
                .style('opacity', 1);
            const fixedSelectionCurve = this.context.append('g')
                .attr('class', 'histogram__curve-data').attr('clip-path', urlFixedSelection)
                .selectAll('dot').data(data).enter().append('circle')
                .attr('r', chartId === this.histogramParams.mainChartId ? 2 : 4)
                .attr('cx', (d) => this.chartAxes.xDataDomain((+d.key).toString()))
                .attr('cy', retrieveData)
                .attr('class', 'histogram__chart--unselected--curve')
                .style('fill', this.histogramParams.colorGenerator.getColor(chartId))
                .style('stroke', this.histogramParams.colorGenerator.getColor(chartId))
                .style('opacity', 1);
            const currentSelectionCurve = this.context.append('g')
                .attr('class', 'histogram__curve-data').attr('clip-path', urlCurrentSelection)
                .selectAll('dot').data(data).enter().append('circle')
                .attr('r', chartId === this.histogramParams.mainChartId ? 2 : 4)
                .attr('cx', (d) => this.chartAxes.xDataDomain((+d.key).toString()))
                .attr('cy', retrieveData)
                .attr('class', 'histogram__chart--unselected--curve')
                .style('fill', this.histogramParams.colorGenerator.getColor(chartId))
                .style('stroke', this.histogramParams.colorGenerator.getColor(chartId))
                .style('opacity', 1);
        }
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
            .attr('id', this.histogramParams.uid + '-cs-curve');
        this.rectangleCurrentClipper = this.currentClipPathContext.append('rect')
            .attr('id', 'clip-rect')
            .attr('x', this.chartAxes.xDomain(this.selectionInterval.startvalue))
            .attr('y', '0')
            .attr('width', this.chartAxes.xDomain(this.selectionInterval.endvalue) - this.chartAxes.xDomain(this.selectionInterval.startvalue))
            .attr('height', this.chartDimensions.height);
    }
}
