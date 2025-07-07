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

import { ColorGenerator } from '../../utils/color-generator';
import { Selection, BaseType } from 'd3-selection';
import { HierarchyRectangularNode } from 'd3-hierarchy';

export interface DonutDimensions {
  svg: Selection<SVGElement, TreeNode, BaseType, TreeNode>;
  width: number;
  height: number;
  containerWidth: number;
  radius: number;
}

export interface DonutTooltip {
  xPosition: number;
  yPosition: number;
  nodeName: string;
  nodeParents: Array<string>;
  nodeCount: number;
  nodeColor: string;
}

export interface TreeNode {
  id: string;
  fieldName: string;
  fieldValue: string;
  size?: number;
  metricValue?: number;
  isOther: boolean;
  children?: Array<TreeNode>;
  color?: string;
}

export interface SimpleNode {
  fieldName: string;
  fieldValue: string;
}

export interface DonutNode extends HierarchyRectangularNode<TreeNode> {
  isSelected: boolean;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
}

export interface ARLASDonutTooltip {
  isShown?: boolean;
  isRightSide?: boolean;
  xPosition?: number;
  yPosition?: number;
  content?: Array<DonutTooltipContent>;
}
export interface DonutTooltipContent {
  percentage?: string;
  value?: string;
  field?: string;
  function?: string;
  metric?: number;
  color?: string;
}

export class DonutUtils {

  public static getNode(nodePath: Array<SimpleNode>, donutNodes: Array<DonutNode>): DonutNode {
    let count = nodePath.length - 1;
    let nodeToSelect = null;
    for (let i = 0; i < donutNodes.length; i++) {
      if (donutNodes[i].data.fieldValue === nodePath[count].fieldValue &&
        donutNodes[i].data.fieldName === nodePath[count].fieldName) {
        nodeToSelect = donutNodes[i];
        break;
      }
    }
    count--;
    while (count >= 0 && nodeToSelect !== null) {
      const children = nodeToSelect.children;
      if (children !== undefined) {
        for (let i = 0; i < children.length; i++) {
          if (children[i].data.fieldValue === nodePath[count].fieldValue &&
            children[i].data.fieldName === nodePath[count].fieldName) {
            nodeToSelect = children[i];
            break;
          } else {
            if (i === children.length - 1) {
              nodeToSelect = null;
            }
          }
        }
      } else {
        nodeToSelect = null;
      }
      count--;
    }
    return nodeToSelect;
  }

  public static getNodeColor(d: DonutNode, donutNodeColorizer: ColorGenerator,
    keysToColors: Array<[string, string]>, colorsSaturationWeight: number): string {
    if (d.data.color) {
      return d.data.color;
    }

    if (d.depth > 0) {
      if (donutNodeColorizer) {
        return donutNodeColorizer.getColor(d.data.fieldValue, keysToColors, colorsSaturationWeight);
      } else {
        return this.getHexColorFromString(d.data.fieldValue + ':' + d.data.fieldName);
      }
    } else {
      return '#fff';
    }
  }

  public static getNodePathAsArray(n: DonutNode): Array<{ fieldName: string; fieldValue: string; }> {
    const nodePathAsArray = new Array<{ fieldName: string; fieldValue: string; }>();
    if (n.depth > 0) {
      nodePathAsArray.push({ fieldName: n.data.fieldName, fieldValue: n.data.fieldValue });
      if (n.parent && n.parent.parent) {
        while (n.parent.parent) {
          n = <DonutNode>n.parent;
          nodePathAsArray.push({ fieldName: n.data.fieldName, fieldValue: n.data.fieldValue });
        }
      }
    }
    return nodePathAsArray;
  }

  public static getNodeToolipAsArray(n: DonutNode, donutNodeColorizer: ColorGenerator,
    keysToColors: Array<[string, string]>, colorsSaturationWeight: number) {
    const tooltipArray: DonutTooltipContent[] = [];
    if (n.depth > 0) {
      const tooltipContent: DonutTooltipContent = {
        field: n.data.fieldName,
        value: n.data.fieldValue,
        metric: n.data.size,
        color: DonutUtils.getNodeColor(n, donutNodeColorizer, keysToColors, colorsSaturationWeight)
      };
      if (n.parent) {
        const num = (n.data.size / n.parent.data.size * 100);
        tooltipContent.percentage = (Math.round(num * 100) / 100).toString();
      }
      tooltipArray.push(tooltipContent);
      if (n.parent && n.parent.parent) {
        while (n.parent.parent) {
          n = <DonutNode>n.parent;
          const tc: DonutTooltipContent = {
            field: n.data.fieldName,
            value: n.data.fieldValue,
            metric: n.data.size,
            color: DonutUtils.getNodeColor(n, donutNodeColorizer, keysToColors, colorsSaturationWeight)
          };
          if (n.parent) {
            const num = (n.data.size / n.parent.data.size * 100);
            tc.percentage =   (Math.round(num * 100) / 100).toString();
          }
          tooltipArray.push(tc);
        }
      }
      return tooltipArray;
    }
  }

  public static getNodePathAsString(n: DonutNode): string {
    const nodePathAsArray = this.getNodePathAsArray(n);
    let path = '';
    nodePathAsArray.forEach(node => {
      path = node.fieldValue + ' > ' + path;
    });
    return path;
  }

  private static getHexColorFromString(text: string): string {
    // string to int
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    // int to rgb
    const hex = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const colorHex = '#' + '00000'.substring(0, 6 - hex.length) + hex;
    return colorHex;
  }
}
