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
import { ARLASDonutTooltip, DonutNode, DonutTooltip, TreeNode } from './utils/DonutUtils';

export class DonutParams {

  /**
   * @description Id of the donut.
   */
  public id;

  /**
   * @description Data displayed on the donut. Each node's size must be specified
   */
  public donutData: TreeNode;

  /**
   * @description Sets the opacity of non-hovered or non-selected nodes.
   */
  public opacity = 0.4;

  /**
   * @description Css class name to use to customize a specific powerbar's style.
   */
  public customizedCssClass;

  /**
   * @description List of selected nodes.
   */
  public selectedArcsList: Array<Array<{ fieldName: string; fieldValue: string; }>> =
    new Array<Array<{ fieldName: string; fieldValue: string; }>>();

  /**
   * @description Whether the donut is multi-selectable.
   */
  public multiselectable = true;

  /**
   * @description Emits the list of selected nodes and the paths to their ultimate parent
   */
  public selectedNodesEvent: Subject<Array<Array<{ fieldName: string; fieldValue: string; }>>> =
    new Subject<Array<Array<{ fieldName: string; fieldValue: string; }>>>();

  /**
   * @description Emits the hovered node and the path to it's parents.
   * The key of the map is the node's name and the value is its color on the donut.
   */
  public hoveredNodesEvent: Subject<Map<string, string>> = new Subject<Map<string, string>>();

  /**
   * @deprecated
   * @description Emits the tooltip of the hovered node.
   */
  public hoveredNodeTooltipEvent: Subject<DonutTooltip> = new Subject<DonutTooltip>();

  /**
   * @description Emits the tooltip of the hovered node.
   */
  public tooltipEvent: Subject<ARLASDonutTooltip> = new Subject<ARLASDonutTooltip>();

  /**
   * @description Tooltip displayed when a node is hovered.
   */
  public tooltip: ARLASDonutTooltip = {};

  /**
   * @description D3 nodes diplayed on the donut.
   */
  public donutNodes: Array<DonutNode>;
  /**
   * @description The SVG element that's the donut is built on.
   */
  public svgElement: SVGElement;
  /**
  * @description The div element that wraps the donut component.
  */
  public donutContainer: HTMLElement;
  /**
   * @description  List of [key, color] couples that associates a hex color to each key
   */
  public keysToColors: Array<[string, string]>;
  /**
   * @description Knowing that saturation scale is [0, 1], `colorsSaturationWeight` is a
   * factor (between 0 and 1) that tightens this scale to [(1-colorsSaturationWeight), 1].
   * Therefore colors saturation of donuts arcs will be within this tightened scale..
   */
  public colorsSaturationWeight: number;
  /**
   * @description an object that implements ColorGenerator interface.
   */
  public donutNodeColorizer: ColorGenerator;

  public numberFormatChar = '';

  /** Dimensions */
  public diameter: number;
  public containerWidth: number;

}
