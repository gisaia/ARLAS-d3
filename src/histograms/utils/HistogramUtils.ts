
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
import * as moment from 'moment';
import { Selection, BaseType } from 'd3-selection';
import { utcFormat } from 'd3-time-format';
import { Axis } from 'd3-axis';
import { ScaleLinear } from 'd3-scale';
import { isNumber } from 'util';
import { format } from 'd3-format';

export const NAN_COLOR = '#d8d8d8';
export const TICK_COLOR = '#fff';
export const TICK_WIDTH = 1.5;
export const TICK_OPACITY = 1;

export interface MarginModel {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface HistogramData {
  key: Date | number;
  value: number;
}

export interface BrushCornerTooltips {
  leftCornerTooltip: BrushTooltip;
  rightCornerTooltip: BrushTooltip;
  verticalCssVisibility: string;
  horizontalCssVisibility: string;
}

export interface BrushTooltip {
  htmlContainer: HTMLElement;
  xPosition: number;
  yPosition: number;
  content: string;
  width?: number;
  cssVisibility?: string;
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
  startvalue: Date | number;
  endvalue: Date | number;
}

export interface SelectedInputValues {
  startvalue: Date | number;
  endvalue: Date | number;
}

export interface ChartDimensions {
  svg: Selection<BaseType, any, BaseType, any>;
  margin: MarginModel;
  width: number;
  height: number;
}

export interface ChartAxes {
  xDomain: any;
  xDataDomain: any;
  yDomain: ScaleLinear<number, number>;
  xTicksAxis: Axis<any>;
  xLabelsAxis: Axis<any>;
  yTicksAxis: Axis<any>;
  yLabelsAxis: Axis<any>;
  stepWidth: number;
  xAxis: Axis<any>;
  yAxis: Axis<any>;
}

export interface SwimlaneAxes {
  xDomain: any;
  xDataDomainArray: Array<any>;
  xTicksAxis: Axis<any>;
  xLabelsAxis: Axis<any>;
  stepWidth: number;
  xAxis: Axis<any>;
}

export interface LaneStats {
  min?: number;
  max?: number;
  sum?: number;
  count?: number;
}

export interface SwimlaneStats {
  columnStats: Map<number, LaneStats>;
  globalStats: LaneStats;
  nbLanes: number;
  minBorder?: number;
  maxBorder?: number;
  bucketLength?: number;
}

export interface SwimlaneOptions {
  /**Hex color attributted to buckets whose values are NaN */
  nan_color?: string;
  /**Hex color attributted to buckets whose values are 0 */
  zeros_color?: string;
  /**The tick plotted on each swimlane bucket that indicates how high/low the bucket value is. */
  level_tick?: TickOptions;
}

export interface TickOptions {
  /**Hex color of the tick */
  color?: string;
  /**Width of the tick in pixels */
  width?: number;
  /**Opacity of the tick */
  opacity?: number;
}

export interface SwimlaneData {
  stats: SwimlaneStats;
  lanes: Map<string, Array<{ key: number, value: number }>>;
}

export interface Tooltip {
  isShown: boolean;
  isRightSide: boolean;
  xPosition: number;
  yPosition: number;
  xContent: string;
  yContent: string;
  yAdditonalInfo?: string;
  width?: number;
}

export class HistogramUtils {

  public static isSelectionBeyondDataDomain(selectedInputValues: SelectedInputValues,
    inputData: Array<HistogramData>,
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

  public static parseDataKey(inputData: Array<HistogramData>,
    dataType: DataType): Array<HistogramData> {
    if (dataType === DataType.time) {
      return this.parseDataKeyToDate(inputData);
    } else {
      const parsedInputData = [];
      inputData.forEach(d => {
        parsedInputData.push({ key: d.key, value: d.value });
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

  private static parseDataKeyToDate(inputData: Array<HistogramData>) {
    const parsedData = new Array<HistogramData>();
    inputData.forEach(d => {
      parsedData.push({ key: new Date(+d.key), value: d.value });
    });
    return parsedData;
  }

  public static getColor(zeroToOne: number, paletteColors: [number, number] | string): tinycolor.Instance {
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
        return tinycolor({ h: h, s: 85, v: 100 });
      } else {
        const color = tinycolor(paletteColors.toString());
        const h = color.toHsl().h;
        const s = color.toHsl().s;
        const l0 = 95;
        const l1 = 35;
        const l = (l0) * (1 - zeroToOne) + (l1) * (zeroToOne);
        return tinycolor({ h: h, s: s, l: l });
      }
    }
  }

  public static toString(value: Date | number, chartType: ChartType, dataType: DataType, isChartMoved: boolean, dateFormat: string,
    dateInterval?: number): string {
    if (value instanceof Date) {
      if (dateFormat && dateFormat !== null) {
        const timeFormat = utcFormat(dateFormat);
        return timeFormat(value);
      } else {
        if (dateInterval !== undefined && dateInterval !== null && dateInterval > 0) {
          const timeFormat = utcFormat(this.getFormatFromDateInterval(dateInterval));
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
          if (dateInterval !== undefined && dateInterval !== null && dateInterval > 0) {
            const timeFormat = utcFormat(this.getFormatFromDateInterval(dateInterval));
            return timeFormat(date);
          } else {
            return date.toUTCString().split(',')[1].replace('GMT', '');
          }
        } else {
          if (dateInterval !== undefined && dateInterval !== null && dateInterval > 0 && dateInterval < 1) {
            roundPrecision = this.getRoundPrecision(dateInterval);
          }
          return formatWithSpace(this.round(value, roundPrecision));
        }
      }
    }
  }

  public static getFormatFromDateInterval(dateInterval): string {
    const duration: moment.Duration = moment.duration(dateInterval);
    let f: string;
    switch (true) {
      case duration.asYears() >= 1: {
        f = '%Y';
        break;
      }
      case duration.asMonths() >= 1: {
        f = '%B %Y';
        break;
      }
      case duration.asDays() >= 1: {
        f = '%d %B %Y';
        break;
      }
      case duration.asHours() >= 1: {
        f = '%d %B %Y %Hh';
        break;
      }
      case duration.asMinutes() >= 1: {
        f = '%d %B %Y %H:%M';
        break;
      }
      case duration.asSeconds() >= 1: {
        f = '%d %B %Y %H:%M:%S';
        break;
      }
    }
    return f;
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

  public static numToString(value: number): string {
    let newValue = value.toString();
    if (value >= 1000) {
      const suffixes = ['', 'k', 'M', 'b', 't'];
      const suffixNum = Math.floor(('' + value).length / 4);
      let shortValue: number;
      for (let precision = 3; precision >= 1; precision--) {
        shortValue = shortValue = Math.round(parseFloat((suffixNum !== 0 ? (value / Math.pow(1000, suffixNum)) : value)
        .toPrecision(precision)));
        const dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z]+/g, '');
        if (dotLessShortValue.length <= 2) { break; }
      }
      let shortNum = shortValue.toString();
      if (shortValue % 1 !== 0) {
        shortNum = shortValue.toFixed(1);
      }
      newValue = shortNum + suffixes[suffixNum];
    }
    return newValue.toString();
  }
}

export enum SwimlaneMode {
  variableHeight, fixedHeight, circles
}

export enum SwimlaneRepresentation {
  column, global
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

export function formatWithSpace(x): string {
  if (isNumber(x)) {
    const trunc = Math.trunc(x);
    const decimal = (x + '').split('.');
    const spacedNumber = Math.abs(trunc).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const spacedNumberString = trunc < 0 ? '-' + spacedNumber : spacedNumber;
    return decimal.length === 2 ? spacedNumberString + '.' + decimal[1] : spacedNumberString;
  }
  return x;
}

export const spaceFormat = (d) => {
  const y = +format('')(d);
  return formatWithSpace(y);
};
