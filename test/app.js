import {ChartCurve,HistogramParams} from '../dist/index.js'
const histogram= new ChartCurve();

const input = {
    "xTicks": 9,
    "yTicks": 2,
    "xLabels": 9,
    "yLabels": 2,
    "xUnit": "",
    "yUnit": "",
    "chartXLabel": "",
    "shortYLabels": false,
    "chartTitle": "Timeline",
    "customizedCssClass": "arlas-timeline",
    "multiselectable": false,
    "brushHandlesHeightWeight": 0.8,
    "dataType": 0,
    "isHistogramSelectable": true,
    "ticksDateFormat": "%b %d %Y  %H:%M",
    "chartType": "bars",
    "chartHeight": 150,
    "chartWidth": 500,
    "yAxisStartsFromZero": true,
    "descriptionPosition": "top",
    "showXTicks": true,
    "showYTicks": true,
    "showXLabels": true,
    "showYLabels": true,
    "showStripes": false,
    "showHorizontalLines": false,
    "isSmoothedCurve": true,
    "barWeight": 0.8,
    "topOffsetRemoveInterval": 10,
    "uid": "test"
  }

const histogramParams = new HistogramParams();
for (const [key, value] of Object.entries(input)) {
    histogramParams[key] = value
  }
histogram.histogramParams = histogramParams;
histogram.histogramParams.multiselectable = true;

histogram.histogramParams.intervalSelectedMap = new Map();
histogram.histogramParams.histogramContainer = document.getElementById('container')
histogram.histogramParams.svgNode = document.getElementById('container').querySelector('svg');
const defaultHistogramData  = [
    {value: 400,   key: 0, chartId :'1'},
    {value: 123,  key: 1, chartId :'1'},
    {value: 333,  key: 2, chartId :'1'},
    {value: 400,  key: 3, chartId :'1'},
    {value: 400,  key: 4, chartId :'1'},
    {value: 212,  key: 5, chartId :'1'},
    {value: 111,  key: 6, chartId :'1'},
    {value: 400,  key: 7, chartId :'1'},
    {value: 400, key: 8, chartId :'1'},
    {value: 120, key: 9, chartId :'1'},
    {value: 120, key: 10, chartId :'1'},
    {value: 123, key: 11, chartId :'1'},
    {value: 100, key: 12, chartId :'1'},
    {value: 222, key: 13, chartId :'1'},
    {value: 120, key: 14, chartId :'1'},


    {value: 212 + 200,  key: 5, chartId :'2'},
    {value: 111 + 250,  key: 6, chartId :'2'},
    {value: 400 + 200,  key: 7, chartId :'2'},
    {value: 400 + 250, key: 8, chartId :'2'},
    {value: 120 + 200, key: 9, chartId :'2'},
    {value: 120 + 250, key: 10, chartId :'2'},
    {value: 123 + 200, key: 11, chartId :'2'},
    {value: 100 + 250, key: 12, chartId :'2'},
    {value: 222 + 200, key: 13, chartId :'2'},
    {value: 120 + 250, key: 14, chartId :'2'},
    {value: 156 + 200, key: 15, chartId :'2'},
    {value: 156 + 250, key: 16, chartId :'2'},


    {value: 212 + 340,  key: 5, chartId :'3'},
    {value: 111 + 300,  key: 6, chartId :'3'},
    {value: 400 + 340,  key: 7, chartId :'3'},
    {value: 400 + 300, key: 8, chartId :'3'},
    {value: 120 + 340, key: 9, chartId :'3'},
    {value: 120 + 300, key: 10, chartId :'3'},
    {value: 123 + 340, key: 11, chartId :'3'},
    {value: 100 + 300, key: 12, chartId :'3'},
    {value: 222 + 340, key: 13, chartId :'3'},
    {value: 120 + 300, key: 14, chartId :'3'},
    {value: 156 + 340, key: 15, chartId :'3'},
    {value: 156 + 300, key: 16, chartId :'3'},






  ];
  histogram.selectionInterval = {
    startvalue : defaultHistogramData[0].key,
    endvalue : defaultHistogramData[defaultHistogramData.length - 1].key
  };
  histogram.histogramParams.histogramData = defaultHistogramData
  histogram.plot(defaultHistogramData)
histogram.resize(document.getElementById('container'))