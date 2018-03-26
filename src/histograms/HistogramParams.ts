import { ChartDimensions, ChartAxes, SwimlaneAxes, SelectedInputValues, SelectedOutputValues, HistogramUtils,
         ChartType, DataType, Position, Tooltip, MarginModel, SwimlaneMode } from './utils/HistogramUtils';
import { Subject } from 'rxjs/Subject';

export class HistogramParams {

  /** Id of the histogram */
  public id;

  // ########################## Inputs ##########################

  /** Data */
  public data: Array<{ key: number, value: number }> | Map<string, Array<{ key: number, value: number }>>;
  public dataType: DataType = DataType.numeric;
  public dataUnit = '';
  public chartType: ChartType = ChartType.area;

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

  /** Area */
  public isSmoothedCurve = true;

  /** Selection & brush */

  public brushHandlesHeightWeight = 0.5;
  public intervalSelection: SelectedInputValues;
  public intervalListSelection: SelectedInputValues[];
  public topOffsetRemoveInterval: number;
  public isHistogramSelectable = true;

  /** Swimlane */
  public swimlaneBorderRadius = 3;
  public swimlaneMode: SwimlaneMode = SwimlaneMode.variableHeight;
  public swimLaneLabelsWidth: number = null;
  public swimlaneHeight: number = null;

  // ########################## Outputs ##########################

  public valuesListChangedEvent: Subject<SelectedOutputValues[]> = new Subject<SelectedOutputValues[]>();
  public hoveredBucketEvent: Subject<Date | number> = new Subject<Date | number>();

  // ########################## Parameter binded with HTML ##########################

  public histogramNode: any;

  public margin: MarginModel = { top: 4, right: 10, bottom: 20, left: 60 };
  public tooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
  public brushLeftTooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
  public brushRightTooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
  public rightBrushElement: HTMLElement;
  public leftBrushElement: HTMLElement;

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
}
