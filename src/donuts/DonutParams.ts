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

import { DonutArc, DonutNode, DonutTooltip } from './utils/DonutUtils';
import { Subject } from 'rxjs';
import { Tooltip } from '../histograms/utils/HistogramUtils';
import { ColorGenerator } from '../utils/color-generator';

export class DonutParams {

  /**
   * @description Id of the donut.
   */
  public id;

  /**
   * @description Data displayed on the donut. Each node's size must be specified
   */
  public donutData: DonutArc;

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
  public selectedArcsList: Array<Array<{ ringName: string, name: string }>> =
    new Array<Array<{ ringName: string, name: string }>>();

  /**
   * @description Whether the donut is multi-selectable.
   */
  public multiselectable = true;

  /**
   * @description Emits the list of selected nodes and the paths to their ultimate parent
   */
  public selectedNodesEvent: Subject<Array<Array<{ ringName: string, name: string }>>> =
    new Subject<Array<Array<{ ringName: string, name: string }>>>();

  /**
   * @description Emits the hovered node and the path to it's parents.
   * The key of the map is the node's name and the value is its color on the donut.
   */
  public hoveredNodesEvent: Subject<Map<string, string>> = new Subject<Map<string, string>>();

  /**
   * @description Emits the tooltip of the hovered node.
   */
  public hoveredNodeTooltipEvent: Subject<DonutTooltip> = new Subject<DonutTooltip>();

  /**
   * @description Tooltip displayed when a node is hovered.
   */
  public tooltip: Tooltip = { isShown: false, isRightSide: false, xPosition: 0, yPosition: 0, xContent: '', yContent: '' };
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
   * @description an object that implements ColorGenerator interface.
   */
  public donutNodeColorizer: ColorGenerator;

}
