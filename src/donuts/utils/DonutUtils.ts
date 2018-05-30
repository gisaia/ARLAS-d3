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

import * as d3 from 'd3';
import { MarginModel } from '../../histograms/utils/HistogramUtils';
import { ColorGenerator } from '../../utils/color-generator';

export interface DonutDimensions {
  svg: d3.Selection< d3.BaseType, any, d3.BaseType, any>;
  width: number;
  height: number;
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

export interface DonutArc {
  name: string;
  id: string;
  ringName: string;
  isOther: boolean;
  size?: number;
  children?: Array<DonutArc>;
}

export interface DonutNode extends d3.HierarchyRectangularNode<any> {
  isSelected: boolean;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
}

export class DonutUtils {

  public static getNode(nodePath: Array<{ringName: string, name: string}>, donutNodes: Array<any>): DonutNode {
    let count = nodePath.length - 1;
    let nodeToSelect = null;
    for (let i = 0; i < donutNodes.length; i++) {
      if (donutNodes[i].data.name === nodePath[count].name &&
        donutNodes[i].data.ringName === nodePath[count].ringName) {
        nodeToSelect = donutNodes[i];
        break;
      }
    }
    count--;
    while (count >= 0 && nodeToSelect !== null ) {
      const children = nodeToSelect.children;
      for (let i = 0; i < children.length; i++) {
        if (children[i].data.name === nodePath[count].name &&
          children[i].data.ringName === nodePath[count].ringName) {
            nodeToSelect = children[i];
            break;
        } else {
          if (i === children.length - 1) {
            nodeToSelect = null;
          }
        }
      }
      count--;
    }
    return nodeToSelect;
  }

  public static getNodeColor(d: DonutNode, donutNodeColorizer: ColorGenerator): string {
    if (d.depth > 0) {
      if (donutNodeColorizer) {
        return donutNodeColorizer.getColor(d.data.name);
      } else {
        return this.getHexColorFromString(d.data.name + ':' + d.data.ringName);
      }
    } else {
      return '#fff';
    }
  }

  public static getNodePathAsArray(n: DonutNode): Array<{ringName: string, name: string}> {
    const nodePathAsArray = new Array<{ringName: string, name: string}>();
    if (n.depth > 0) {
      nodePathAsArray.push({ringName: n.data.ringName, name: n.data.name});
      if (n.parent && n.parent.parent) {
        while (n.parent.parent) {
          n = <DonutNode>n.parent;
          nodePathAsArray.push({ringName: n.data.ringName, name: n.data.name});
        }
      }
    }
    return nodePathAsArray;
  }

  public static getNodePathAsString(n: DonutNode): string {
    const nodePathAsArray = this.getNodePathAsArray(n);
    let path = '';
    nodePathAsArray.forEach(node => {
      path = node.name + ' > ' + path;
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
