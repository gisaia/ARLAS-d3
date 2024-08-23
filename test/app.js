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

import { ChartCurve, HistogramParams, ChartBars, SwimlaneBars, ChartArea, OneSelectionDonut, DonutParams, DataType } from '../dist/index.js'
import { Dimensions, Granularity, Margins, Timeline } from '../dist/index.js'


const inputCharts = {
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
  "barWeight": 0.8,
  "topOffsetRemoveInterval": 10,
  "uid": "test",
  "isSmoothedCurve": true
}

const histogramParams = new HistogramParams();
histogramParams.useUtc = true;
for (const [key, value] of Object.entries(inputCharts)) {
  histogramParams[key] = value;
}

const defaultHistogramData = [
  { value: 400, key: 0, chartId: '1' },
  { value: 123, key: 1000.56, chartId: '1' },
  { value: 333, key: 2000.53259065, chartId: '1' },
  { value: 400, key: 3000, chartId: '1' },
  { value: 400, key: 4000, chartId: '1' },
  { value: 212, key: 5000, chartId: '1' },
  { value: 111, key: 6000, chartId: '1' },
  { value: 400, key: 7000, chartId: '1' },
  { value: 400, key: 8000, chartId: '1' },
  { value: 120, key: 9000, chartId: '1' },
  { value: 120, key: 10000, chartId: '1' },
  { value: 123, key: 11000, chartId: '1' },
  { value: 100, key: 12000, chartId: '1' },
  { value: 222, key: 13000, chartId: '1' },
  { value: 120, key: 14000, chartId: '1' },


  { value: 212 + 200, key: 5000, chartId: '2' },
  { value: 111 + 250, key: 6000, chartId: '2' },
  { value: 400 + 200, key: 7000, chartId: '2' },
  { value: 400 + 250, key: 8000, chartId: '2' },
  { value: 120 + 200, key: 9000, chartId: '2' },
  { value: 120 + 250, key: 10000, chartId: '2' },
  { value: 123 + 200, key: 11000, chartId: '2' },
  { value: 100 + 250, key: 12000, chartId: '2' },
  { value: 222 + 200, key: 13000, chartId: '2' },
  { value: 120 + 250, key: 14000, chartId: '2' },
  { value: 156 + 200, key: 15000, chartId: '2' },
  { value: 156 + 250, key: 16000, chartId: '2' },


  { value: 212 + 340, key: 5000, chartId: '3' },
  { value: 111 + 300, key: 6000, chartId: '3' },
  { value: 400 + 340, key: 7000, chartId: '3' },
  { value: 400 + 300, key: 8000, chartId: '3' },
  { value: 120 + 340, key: 9000, chartId: '3' },
  { value: 120 + 300, key: 10000, chartId: '3' },
  { value: 123 + 340, key: 11000, chartId: '3' },
  { value: 100 + 300, key: 12000, chartId: '3' },
  { value: 222 + 340, key: 13000, chartId: '3' },
  { value: 120 + 300, key: 14000, chartId: '3' },
  { value: 156 + 340, key: 15000, chartId: '3' },
  { value: 156 + 300, key: 16000, chartId: '3' },
];

const startDate = 1616180400000;
const dt = 1000 * 3600 * 24;

const timeHistogramData = [];
for (let i=0; i<10; i++) {
  timeHistogramData.push({ value: Math.random() * 300 - 100, key: new Date(startDate + i*dt), chartId: '1' });
}

const histogramBars = new ChartBars();
displayHistogram(histogramBars, 'containerBars', defaultHistogramData);
const histogramCurve = new ChartCurve();
displayHistogram(histogramCurve, 'containerCurve', defaultHistogramData, true);
const histogramArea = new ChartArea();
displayHistogram(histogramArea, 'containerArea', defaultHistogramData);
const timeHistogramBars = new ChartBars();
displayHistogram(timeHistogramBars, 'containerHistTime', timeHistogramData, false, DataType.time)

function displayHistogram(histogram, containerName, data, selectionOverflow = false, dataType = DataType.numeric) {
  histogram.histogramParams = histogramParams;
  histogram.histogramParams.dataType = dataType;
  histogram.histogramParams.multiselectable = true;
  // histogram.histogramParams.selectionType = 'slider';
  histogram.histogramParams.intervalSelectedMap = new Map();
  histogram.histogramParams.histogramContainer = document.getElementById(containerName)
  histogram.histogramParams.svgNode = document.getElementById(containerName).querySelector('svg');

  histogram.histogramParams.histogramData = data;
  histogram.plot(data);

  histogram.setSelectedInterval({
    startvalue: data[0].key,
    endvalue: selectionOverflow ? 10 * +data[data.length - 1].key : +data[data.length - 1].key
  });
}

/** Timeline */

const svg = document.getElementById('containerTimeline').querySelector('svg');
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

/** Swimlanes */

const swimlane = new SwimlaneBars()

const swimlaneInput = {
  "xTicks": 5,
  "yTicks": 2,
  "xLabels": 5,
  "yLabels": 2,
  "xUnit": "",
  "yUnit": "",
  "chartXLabel": "",
  "shortYLabels": false,
  "chartTitle": "Swimlane",
  "customizedCssClass": "arlas-timeline",
  "multiselectable": false,
  "brushHandlesHeightWeight": 0.8,
  "dataType": 1,
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
  "uid": "testSwimlane",
  "swimlaneBorderRadius": 3,
  "swimlaneMode": 1,
  "swimlaneHeight": 20,
  "swimlaneLabelsWidth": 10,
  "swimlaneOptions": {
    "nan_colors": "#fff"
  },
  "swimlaneRepresentation": 0
}

const swimlaneParams = new HistogramParams();
for (const [key, value] of Object.entries(swimlaneInput)) {
  swimlaneParams[key] = value;
}

swimlane.histogramParams = swimlaneParams;
swimlane.histogramParams.intervalSelectedMap = new Map();
swimlane.histogramParams.histogramContainer = document.getElementById('containerSwimlane')
swimlane.histogramParams.svgNode = document.getElementById('containerSwimlane').querySelector('svg');

const lanes = new Map();
lanes.set('Sweden', [
  {key: 1574208000000, value: 46428},
  {key: 1574211600000, value: 2278},
  {key: 1574215200000, value: 3567},
  {key: 1574218800000, value: 4716},
  {key: 1574222400000, value: 5883},
  {key: 1574226000000, value: 3529}
]);
lanes.set('Denmark', [
  {key: 1574208000000, value: 4958},
  {key: 1574211600000, value: 95848},
  {key: 1574215200000, value: 359},
  {key: 1574218800000, value: 2954},
  {key: 1574222400000, value: 394},
  {key: 1574226000000, value: 38454}
])
lanes.set('Norway', [
  {key: 1574208000000, value: 3564},
  {key: 1574211600000, value: 4534},
  {key: 1574215200000, value: 35334},
  {key: 1574218800000, value: 3642},
  {key: 1574222400000, value: 742},
  {key: 1574226000000, value: 2563}
])

let sum = 0;
let max = -Infinity;
let min = Infinity;

lanes.forEach(v => {
  v.forEach(val => {
    sum += val.value;
    if (max < val.value) {
      max = val.value;
    }
    if ( min > val.value) {
      min = val.value;
    }
  });
});

const columnStats = new Map()
const keys = lanes.get('Sweden').map(bucket => bucket.key);

keys.forEach((val, idx) => {
  let sum = 0;
  let max = -Infinity;
  let min = Infinity;
  lanes.forEach(lane => {
    sum += lane[idx].value;
    if (max < lane[idx].value) {
      max = lane[idx].value;
    }
    if ( min > lane[idx].value) {
      min = lane[idx].value;
    }
  });
  columnStats.set(val, {
    max: max,
    min: min,
    sum: sum
  });
})

const stats = {
  bucketLength: 3600000,
  columnStats: columnStats,
  globalStats: {
    min: min,
    max: max,
    sum: sum,
    count: 18
  },
  maxBorder: 1574226000000,
  minBorder: 1574208000000,
  nbLanes: 3
}

const defaultSwimlaneData = {
  lanes: lanes,
  stats: stats
};
swimlane.selectionInterval = {
  startvalue: keys[0],
  endvalue: keys[keys.length - 1]
};

swimlane.histogramParams.swimlaneData = defaultSwimlaneData;
swimlane.plot(defaultSwimlaneData);
swimlane.resize(document.getElementById('containerSwimlane'));

/** Donut */

const donutData = {
  fieldValue: 'root',
  fieldName: 'root',
  size: 1640,
  children : [
    {
      fieldValue: 'sentinelle',
      fieldName: 'satellites',
      size: 230,
      children : [
        {
          fieldValue: 'sentinelle1',
          fieldName: 'mission',
          size: 100
        },
        {
          fieldValue: 'sentinelle2',
          fieldName: 'mission',
          size: 130
        }
      ]
    },
    {
      fieldValue: 'SPOT',
      fieldName: 'satellites',
      size: 1410,
      children : [
        {
          fieldValue: 'SPOT5',
          fieldName: 'mission',
          size: 30
        },
        {
          fieldValue: 'SPOT6',
          size: 140,
          fieldName: 'mission',
          children : [
            {
              fieldValue: 'FR1',
              fieldName: 'emetteur',
              size: 10
            },
            {
              fieldValue: 'FR2',
              fieldName: 'emetteur',
              size: 100
            }
          ]
        },
        {
          fieldValue: 'SPOT7',
          fieldName: 'mission',
          size: 240,
          children : [
            {
              fieldValue: 'FR1',
              fieldName: 'emetteur',
              size: 20
            },
            {
              fieldValue: 'FR2',
              fieldName: 'emetteur',
              size: 110
            },
            {
              fieldValue: 'FR3',
              fieldName: 'emetteur',
              size: 110
            }
          ]
        }
      ]
    }
  ]
};

const donut = new OneSelectionDonut();
donut.donutParams = new DonutParams();
donut.donutParams.diameter = 150;
donut.donutParams.donutData = donutData;
donut.donutParams.donutContainer = document.getElementById('containerDonut');
donut.donutParams.svgElement = document.getElementById('containerDonut').querySelector('svg');
donut.plot();
donut.resize(document.getElementById('containerDonut'));
