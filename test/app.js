import {ChartBars,HistogramParams} from '../dist/index.js'
const histogram= new ChartBars();

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
    "xAxisPosition": 0,
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


histogram.histogramParams.intervalSelectedMap = new Map();
histogram.histogramParams.histogramContainer = document.getElementById('container')
histogram.histogramParams.svgNode = document.getElementById('container').querySelector('svg');
const defaultHistogramData = [
    {value: -400,   key: 0},
    {value: -123,  key: 1},
    {value: -333,  key: 2},
    {value: -400,  key: 3},
    {value: -400,  key: 4},
    {value: -212,  key: 5},
    {value: -111,  key: 6},
    {value: -400,  key: 7},
    {value: -400, key: 8},
    {value: -120, key: 9},
    {value: -120, key: 10},
    {value: -123, key: 11},
    {value: -100, key: 12},
    {value: -222, key: 13},
    {value: -120, key: 14},
  ];
  histogram.selectionInterval = {
    startvalue : defaultHistogramData[0].key,
    endvalue : defaultHistogramData[defaultHistogramData.length - 1].key
  };
  histogram.histogramParams.histogramData = defaultHistogramData
  histogram.plot(defaultHistogramData)
histogram.resize(document.getElementById('container'))