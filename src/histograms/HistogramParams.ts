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

import { Subject } from 'rxjs';
import { ColorGenerator } from '../utils/color-generator';
import { XBucket } from './buckets/buckets';
import {
  BucketInterval,
  ChartType, DataType,
  HistogramData,
  HistogramTooltip,
  HistogramUtils,
  MarginModel,
  Position,
  SelectedInputValues, SelectedOutputValues,
  SwimlaneData,
  SwimlaneMode,
  SwimlaneOptions,
  SwimlaneRepresentation,
  Tooltip
} from './utils/HistogramUtils';

export interface LegendValue {
  key: string;
  color: string;
}

export class HistogramParams {

  /** Id of the histogram */
  public id;
  public mainChartId: string;

  // ########################## Inputs ##########################

  /** Data */
  public histogramData: Array<HistogramData> = [];
  public swimlaneData?: SwimlaneData;
  public dataType = DataType.numeric;
  public dataUnit = '';
  public chartType = ChartType.area;
  public moveDataByHalfInterval = false;
  public bucketRange?: number;
  public bucketInterval?: BucketInterval;

  /** Dimensions */
  public chartWidth = 0;
  public chartHeight = 0;

  /** Axes and ticks */
  public xTicks = 5;
  public yTicks = 5;
  public xLabels = 5;
  public yLabels = 5;
  public showXTicks = true;
  public showYTicks = true;
  public showXLabels = true;
  public showYLabels = true;
  public shortYLabels = false;
  public yAxisFromZero = false;
  public showStripes = true;
  public showHorizontalLines = true;
  public ticksDateFormat = '';
  public xAxisPosition: Position = Position.bottom;
  public descriptionPosition: Position = Position.bottom;
  // Add 2 pixel around each label to detect overlap.
  public xLabelOverlapPadding  = 2;
  // 4 is an arbitrary value to displayed one or 2 ticks between each value.
  public xLabelsToTicksFactor  = 4;

  /** Desctiption */
  public chartTitle = '';
  public valuesDateFormat = '';

  /** Bars */
  public barWeight = 0.6;
  public multiselectable = false;
  public barOptions: Partial<BarOptions> = {};

  /** Area */
  public isSmoothedCurve = true;

  /** Selection & brush */

  public selectionType: SelectionType = SelectionType.rectangle;
  public handlesHeightWeight = 0.5;
  public handlesRadius = 3;

  // Only used to store a value => remove it
  // public intervalSelection: SelectedInputValues;
  public intervalListSelection: SelectedInputValues[] = [];
  // Does nothing, to remove
  // public topOffsetRemoveInterval: number;
  public isHistogramSelectable = true;
  public displayOnlyIntervalsWithData = false;

  /** Swimlane */
  public swimlaneBorderRadius = 3;
  public swimlaneMode: SwimlaneMode = SwimlaneMode.variableHeight;
  public swimlaneRepresentation: SwimlaneRepresentation = SwimlaneRepresentation.global;
  public swimLaneLabelsWidth = 100;
  public swimlaneHeight = 0;
  public swimlaneOptions: SwimlaneOptions = {};
  public selectedSwimlanes = new Set<string>();
  public paletteColors?: [number, number] | string;
  public legend = new Array<LegendValue>();

  public numberFormatChar = ' ';

  // ########################## Outputs ##########################

  public valuesListChangedEvent = new Subject<SelectedOutputValues[]>();
  public hoveredBucketEvent = new Subject<XBucket | undefined>();
  public selectedSwimlanesEvent = new Subject<Set<string>>();
  public tooltipEvent = new Subject<HistogramTooltip>();

  // ########################## Parameter bound with HTML ##########################

  public histogramContainer?: HTMLElement;
  public svgNode?: SVGElement;

  public margin: MarginModel = { top: 4, right: 10, bottom: 20, left: 60 };
  public tooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };

  public displaySvg = 'none';
  public dataLength = 0;

  public startValue: string = '';
  public endValue: string = '';
  public showTitle = true;

  public intervalSelectedMap = new Map<string, { values: SelectedOutputValues; x_position: number; }>();
  public selectionListIntervalId: string[] = [];

  public swimlaneDataDomain: Array<{ key: number; value: number; }> = [];

  // ######################### Parameters set in the component ########################
  public hasDataChanged = false;
  public uid = HistogramUtils.generateUID();
  public displayHorizontal = 'hidden';
  public displayVertical = 'hidden';
  public useUtc = false;
  public colorGenerator?: ColorGenerator;

  public constructor(id: string, mainChartId: string) {
    this.id = id;
    this.mainChartId = mainChartId;
  }
}

export interface BarOptions {
  selected_style: Style;
  unselected_style: Style;
  /** bar weight applied to bars width. ]0,1]. Not implemented */
  bar_weight: number;
  /** Optional head band on a bar. */
  head_band: BarHeadBand;
}

export interface BarHeadBand {
  selected_style: Style;
  unselected_style: Style;
  selected_height: number;
  unselected_height: number;
}

export interface Style {
  /** bars fill color. Not implemented */
  fill: string;
  /** bars stroke color. Not implemented */
  stroke: string;
  /** bars stroke width in px. Not implemented */
  stroke_width: number;

  background_color: string;
  background_opacity: number;
}

export enum SelectionType {
  slider = 'slider',
  rectangle = 'rectangle'
}

