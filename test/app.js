import { ChartCurve, HistogramParams, ChartBars  } from '../dist/index.js'
import { Dimensions, Granularity, Margins, Timeline } from '../dist/index.js'

const histogram = new ChartBars();


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
const defaultHistogramData = [
  { value: 400, key: 0, chartId: '1' },
  { value: 123, key: 1, chartId: '1' },
  { value: 333, key: 2, chartId: '1' },
  { value: 400, key: 3, chartId: '1' },
  { value: 400, key: 4, chartId: '1' },
  { value: 212, key: 5, chartId: '1' },
  { value: 111, key: 6, chartId: '1' },
  { value: 400, key: 7, chartId: '1' },
  { value: 400, key: 8, chartId: '1' },
  { value: 120, key: 9, chartId: '1' },
  { value: 120, key: 10, chartId: '1' },
  { value: 123, key: 11, chartId: '1' },
  { value: 100, key: 12, chartId: '1' },
  { value: 222, key: 13, chartId: '1' },
  { value: 120, key: 14, chartId: '1' },


  { value: 212 + 200, key: 5, chartId: '2' },
  { value: 111 + 250, key: 6, chartId: '2' },
  { value: 400 + 200, key: 7, chartId: '2' },
  { value: 400 + 250, key: 8, chartId: '2' },
  { value: 120 + 200, key: 9, chartId: '2' },
  { value: 120 + 250, key: 10, chartId: '2' },
  { value: 123 + 200, key: 11, chartId: '2' },
  { value: 100 + 250, key: 12, chartId: '2' },
  { value: 222 + 200, key: 13, chartId: '2' },
  { value: 120 + 250, key: 14, chartId: '2' },
  { value: 156 + 200, key: 15, chartId: '2' },
  { value: 156 + 250, key: 16, chartId: '2' },


  { value: 212 + 340, key: 5, chartId: '3' },
  { value: 111 + 300, key: 6, chartId: '3' },
  { value: 400 + 340, key: 7, chartId: '3' },
  { value: 400 + 300, key: 8, chartId: '3' },
  { value: 120 + 340, key: 9, chartId: '3' },
  { value: 120 + 300, key: 10, chartId: '3' },
  { value: 123 + 340, key: 11, chartId: '3' },
  { value: 100 + 300, key: 12, chartId: '3' },
  { value: 222 + 340, key: 13, chartId: '3' },
  { value: 120 + 300, key: 14, chartId: '3' },
  { value: 156 + 340, key: 15, chartId: '3' },
  { value: 156 + 300, key: 16, chartId: '3' },






];
histogram.selectionInterval = {
  startvalue: defaultHistogramData[0].key,
  endvalue: defaultHistogramData[defaultHistogramData.length - 1].key
};
histogram.histogramParams.histogramData = defaultHistogramData;
histogram.plot(defaultHistogramData);
histogram.resize(document.getElementById('container'));


const svg = document.getElementById('container2').querySelector('svg');
const margins = (new Margins()).setBottom(5).setTop(5).setRight(0).setLeft(0);
const dimensions = (new Dimensions(1000, 50)).setMargins(margins);
const timeline = (new Timeline(svg));
const granularity = Granularity.season;
timeline.setDimensions(dimensions);
timeline.setGranularity(granularity);

timeline.setBoundDates(getBoundDates(granularity));
timeline.setData(getMockData(granularity));
timeline.plot();


function getBoundDates(granularity) {
  switch (granularity) {
    case Granularity.day:
      return [new Date(2022, 8, 0), new Date(2023, 1, 30, 5)];
    case Granularity.month:
      return [new Date(2019, 10, 15), new Date(2022, 11, 15)];
    case Granularity.season:
      return [new Date(2019, 10), new Date(2022, 3)];
    case Granularity.year:
      return [new Date(1999, 0), new Date(2023, 5)];
  }
}


function getMockData(granularity) {
  const mockData = [];
  if (granularity === Granularity.day) {
      for (let i = 0; i < 60; i++) {
          const r = Math.ceil(Math.random() * 1000);
          if (r % 2 === 0) {
              mockData.push({
                date: new Date(2022, r % 4 === 0 ? 1 : 2, Math.min(Math.ceil(Math.random() * 10), 28)),
                metadata: {
                  thumbnail: ''
                }
              });
          }
      }
  } else if ((granularity === Granularity.month) || (granularity === Granularity.season)) {
      for (let i = 0; i < 24; i++) {
          let year = 2020;
          if (i % 2 === 0) {
              year = 2021;
          }
          if (i === 2 || i === 7) {
              year = 2022;
          }
          const month = Math.floor(Math.random() * 12);;
          mockData.push({
            date: new Date(year, month, 1),
            metadata: {
              thumbnail: ''
            }
          });
      }
  } else if (granularity === Granularity.year) {
      for (let i = 1999; i < 2024; i++) {
        if (Math.random() < 0.5) {
          mockData.push({
            date: new Date(i, Math.floor(Math.random() * 12)),
            metadata: {
              thumbnail: ''
            }
          });
        }
      }
  }
  return mockData;
}