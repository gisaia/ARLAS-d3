
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

import * as tinycolor from 'tinycolor2';
import * as d3 from 'd3';
import * as moment from 'moment';

export interface MarginModel {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface HistogramData {
  key: Date|number;
  value: number;
}

export interface SwimlaneData {
  key: string;
  value: Array<{ key: number, value: number }>;
}

export interface SwimlaneParsedData {
  key: string;
  value: Array<{ key: number | Date, value: number }>;
}

export interface SelectedOutputValues {
  startvalue: Date|number;
  endvalue: Date|number;
}

export interface SelectedInputValues {
  startvalue: Date | number;
  endvalue: Date | number;
}

export interface ChartDimensions {
  svg: d3.Selection< d3.BaseType, any, d3.BaseType, any>;
  margin: MarginModel;
  width: number;
  height: number;
}

export interface ChartAxes {
  xDomain: any;
  xDataDomain: any;
  yDomain: d3.ScaleLinear<number, number>;
  xTicksAxis: d3.Axis<any>;
  xLabelsAxis: d3.Axis<any>;
  yTicksAxis: d3.Axis<any>;
  yLabelsAxis: d3.Axis<any>;
  stepWidth: number;
  xAxis: d3.Axis<any>;
  yAxis: d3.Axis<any>;
}

export interface SwimlaneAxes {
  xDomain: any;
  xDataDomainArray: Array<any>;
  xTicksAxis: d3.Axis<any>;
  xLabelsAxis: d3.Axis<any>;
  stepWidth: number;
  xAxis: d3.Axis<any>;
}

export interface Tooltip {
  isShown: boolean;
  isRightSide: boolean;
  xPosition: number;
  yPosition: number;
  xContent: string;
  yContent: string;
  width?: number;
}

export class HistogramUtils {

  public static isSelectionBeyondDataDomain(selectedInputValues: SelectedInputValues,
     inputData: Array<{ key: number, value: number }>,
     intervalSelectedMap: Map<string, { values: SelectedOutputValues, x_position: number }>): boolean {

    let min = selectedInputValues.startvalue;
    let max = selectedInputValues.endvalue;

    intervalSelectedMap.forEach(values => {
        if (min > values.values.startvalue) {
          min = values.values.startvalue;
        }

        if (max < values.values.endvalue) {
          max = values.values.endvalue;
        }
      });
    if (inputData.length !== 0) {
      return +min < inputData[0].key || +max > inputData[inputData.length - 1].key;
    } else {
      return true;
    }
  }

  public static parseDataKey(inputData: Array<{ key: number, value: number }>,
    dataType: DataType): Array<HistogramData> {
      if (dataType === DataType.time) {
        return this.parseDataKeyToDate(inputData);
      } else {
        const parsedInputData = [];
        inputData.forEach(d => {
          parsedInputData.push({key: d.key, value: d.value});
        });
        return parsedInputData;
      }
  }

  public static parseSelectedValues(selectedValues: SelectedInputValues, dataType: DataType): SelectedOutputValues {
    const parsedSelectedValues: SelectedOutputValues = { startvalue: null, endvalue: null };
    if (dataType === DataType.time) {
      if ((typeof (<Date>selectedValues.startvalue).getMonth === 'function')) {
        parsedSelectedValues.startvalue = new Date(<Date>selectedValues.startvalue);
        parsedSelectedValues.endvalue = new Date(<Date>selectedValues.endvalue);
      } else {
        parsedSelectedValues.startvalue = new Date(<number>selectedValues.startvalue);
        parsedSelectedValues.endvalue = new Date(<number>selectedValues.endvalue);
      }
      return parsedSelectedValues;
    } else {
      return selectedValues;
    }
  }

  public static parseSwimlaneDataKey(swimlanesInputData: Map<string, Array<{ key: number, value: number }>>,
    dataType: DataType): Map<string, Array<HistogramData>> {
    const swimlaneParsedDataMap = new Map<string, Array<HistogramData>>();
    swimlanesInputData.forEach((swimlane, key) => {
      if (swimlane !== null && Array.isArray(swimlane) && swimlane.length > 0) {
        swimlaneParsedDataMap.set(key, this.parseDataKey(swimlane, dataType));
      }
    });
    return swimlaneParsedDataMap;
  }

  private static parseDataKeyToDate(inputData: Array<{ key: number, value: number }>) {
    const parsedData = new Array<HistogramData>();
    inputData.forEach(d => {
      parsedData.push({ key: new Date(+d.key), value: d.value });
    });
    return parsedData;
  }

  public static getColor(zeroToOne: number, paletteColors: [number, number] | string): any {
    // Scrunch the green/cyan range in the middle
    const sign = (zeroToOne < .5) ? -1 : 1;
    zeroToOne = sign * Math.pow(2 * Math.abs(zeroToOne - .5), .35) / 2 + .5;

    // Linear interpolation between the cold and hot
    if (paletteColors === null) {
      const h0 = 259;
      const h1 = 12;
      const h = (h0) * (1 - zeroToOne) + (h1) * (zeroToOne);
      return tinycolor({ h: h, s: 100, v: 90 });
    } else {
      if (paletteColors instanceof Array) {
        const h0 = paletteColors[1];
        const h1 = paletteColors[0];
        const h = (h0) * (1 - zeroToOne) + (h1) * (zeroToOne);
        return tinycolor({ h: h, s: 100, v: 90 });
      } else {
        const color = tinycolor(paletteColors.toString());
        const h = color.toHsl().h;
        const s = color.toHsl().s;
        const l0 = 85;
        const l1 = 20;
        const l = (l0) * (1 - zeroToOne) + (l1) * (zeroToOne);
        return tinycolor({ h: h, s: s, l: l });
      }
    }
  }

  public static toString(value: Date | number, chartType: ChartType, dataType: DataType, isChartMoved: boolean, dateFormat: string,
     dateInterval?: number): string {
    if (value instanceof Date) {
      if (dateFormat && dateFormat !== null) {
        const timeFormat = d3.utcFormat(dateFormat);
        return timeFormat(value);
      } else {
        if (dateInterval) {
          const timeFormat = d3.utcFormat(this.getFormatFromDateInterval(dateInterval));
          return timeFormat(value);
        } else {
          return value.toUTCString().split(',')[1].replace('GMT', '');
        }
      }
    } else {
      if (chartType === ChartType.oneDimension) {
        return Math.trunc(value).toString();
      } else {
        let roundPrecision = (chartType === ChartType.area && isChartMoved) ? 1 : 0;
        if (dataType === DataType.time) {
          const date = new Date(this.round(value, roundPrecision));
          if (dateInterval) {
            const timeFormat = d3.utcFormat(this.getFormatFromDateInterval(dateInterval));
            return timeFormat(date);
          } else {
            return date.toUTCString().split(',')[1].replace('GMT', '');
          }
        } else {
          if (dateInterval !== undefined && dateInterval < 1) {
            roundPrecision = this.getRoundPrecision(dateInterval);
          }
          return this.round(value, roundPrecision).toString();
        }
      }
    }
  }

  public static getFormatFromDateInterval(dateInterval): string {
    const duration: moment.Duration = moment.duration(dateInterval);
    let format;
    switch (true) {
      case duration.asYears() >= 1 : {
        format = '%Y';
        break;
      }
      case duration.asMonths() >= 1 : {
        format = '%B %Y';
        break;
      }
      case duration.asDays() >= 1 : {
        format = '%d %B %Y';
        break;
      }
      case duration.asHours() >= 1 : {
        format = '%d %B %Y %Hh';
        break;
      }
      case duration.asMinutes() >= 1 : {
        format = '%d %B %Y %H:%M';
        break;
      }
      case duration.asSeconds() >= 1 : {
        format = '%d %B %Y %H:%M:%S';
        break;
      }
    }
    return format;
  }

  public static generateUID(): string {
    return ((new Date()).getUTCMilliseconds() + Math.random()).toString();
  }

  public static getIntervalGUID(start: Date | number, end: Date | number): string {
    let guid;
    if ((typeof (<Date>start).getMonth === 'function')) {
      guid = (<Date>start).getTime().toString() + (<Date>end).getTime().toString();
    } else {
      guid = start.toString() + end.toString();
    }
    return guid;
  }

  public static getRoundPrecision(dataInterval: number): number {
    const order = Math.log10(dataInterval);
    let roundPrecision = 0;
    if (order < 0) {
      roundPrecision = -Math.trunc(order);
      if (Math.pow(10, -roundPrecision) !== dataInterval) {
        roundPrecision += 1;
      }
    } else {
      roundPrecision = Math.trunc(order);
    }
    return roundPrecision;
  }

  public static round(value, precision): number {
    let multiplier;
    if (precision === 0) {
      return Math.round(value);
    } else {
      multiplier = Math.pow(10, precision * 10 || 0);
      return +(Math.round(value * multiplier) / multiplier).toFixed(precision);
    }
  }
}

export enum SwimlaneMode {
  variableHeight, fixedHeight, circles
}
export enum DataType {
  numeric, time
}

export enum ChartType {
  area, bars, oneDimension, swimlane
}

export enum Position {
  top, bottom
}
