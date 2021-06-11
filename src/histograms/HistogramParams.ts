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

import { SelectedInputValues, SelectedOutputValues, ChartType, DataType, Position, Tooltip, MarginModel,
  SwimlaneMode,
  SwimlaneData,
  HistogramData,
  SwimlaneRepresentation,
  SwimlaneOptions,
  HistogramTooltip} from './utils/HistogramUtils';
import { Subject } from 'rxjs';
import { ColorGenerator } from 'utils/color-generator';

export class HistogramParams {

 /** Id of the histogram */
 public id;

 // ########################## Inputs ##########################

 /** Data */
 public histogramData: Array<HistogramData>;
 public swimlaneData: SwimlaneData;
 public dataType: DataType = DataType.numeric;
 public dataUnit = '';
 public chartType: ChartType = ChartType.area;
 public moveDataByHalfInterval = false;

 /** Dimensions */
 public chartWidth: number = null;
 public chartHeight: number = null;

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
 public ticksDateFormat: string = null;
 public xAxisPosition: Position = Position.bottom;
 public descriptionPosition: Position = Position.bottom;

 /** Desctiption */
 public chartTitle = '';
 public valuesDateFormat: string = null;

 /** Bars */
 public paletteColors: [number, number] | string = null;
 public barWeight = 0.6;
 public multiselectable = false;

 public barOptions: BarOptions;

 /** Area */
 public isSmoothedCurve = true;

 /** Selection & brush */

 public brushHandlesHeightWeight = 0.5;
 public intervalSelection: SelectedInputValues;
 public intervalListSelection: SelectedInputValues[];
 public topOffsetRemoveInterval: number;
 public isHistogramSelectable = true;
 public displayOnlyIntervalsWithData = false;

 /** Swimlane */
 public swimlaneBorderRadius = 3;
 public swimlaneMode: SwimlaneMode = SwimlaneMode.variableHeight;
 public swimlaneRepresentation: SwimlaneRepresentation = SwimlaneRepresentation.global;
 public swimLaneLabelsWidth: number = null;
 public swimlaneHeight: number = null;
 public swimlaneOptions: SwimlaneOptions;
 public selectedSwimlanes = new Set<string>();

 public numberFormatChar = ' ';

 // ########################## Outputs ##########################

 public valuesListChangedEvent: Subject<SelectedOutputValues[]> = new Subject<SelectedOutputValues[]>();
 public hoveredBucketEvent: Subject<Date | number> = new Subject<Date | number>();
 public selectedSwimlanesEvent = new Subject<Set<string>>();
 public tooltipEvent: Subject<HistogramTooltip> = new Subject();
 public tooltipsEvent: Subject<HistogramTooltip[]> = new Subject();

 // ########################## Parameter binded with HTML ##########################

 public histogramContainer: HTMLElement;
 public svgNode: SVGElement;

 public margin: MarginModel = { top: 4, right: 10, bottom: 20, left: 60 };
 public tooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };

 public legend;
 public displaySvg = 'none';
 public dataLength = 0;

 public startValue: string = null;
 public endValue: string = null;
 public showTitle = true;

 public intervalSelectedMap: Map<string, { values: SelectedOutputValues, x_position: number }>
   = new Map<string, { values: SelectedOutputValues, x_position: number }>();
 public selectionListIntervalId: string[] = [];

 public swimlaneDataDomain: Array<{ key: number, value: number }>;
 public swimlaneXTooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
 public swimlaneTooltipsMap = new Map<string, Tooltip>();

 // ######################### Parameters set in the component ########################
 public hasDataChanged = false;
 public uid: string;
 public displayHorizontal = 'hidden';
 public displayVertical = 'hidden';
 public useUtc: boolean;
}

export interface BarOptions {
 selected_style?: Style;
 unselected_style?: Style;
 /** bar weight applied to bars width. ]0,1]. Not implemented */
 bar_weight?: number;
 /** Optional head band on a bar. */
 head_band?: BarHeadBand;
}

export interface BarHeadBand {
 selected_style?: Style;
 unselected_style?: Style;
 selected_height?: number;
 unselected_height?: number;
}

export interface Style {
 /** bars fill color. Not implemented */
 fill?: string;
 /** bars stroke color. Not implemented */
 stroke?: string;
 /** bars stroke width in px. Not implemented */
 stroke_width?: number;

 background_color?: string;
 background_opacity?: number;
}
