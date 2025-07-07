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

import { DonutParams } from './DonutParams';
import { DonutNode, DonutDimensions, DonutUtils, TreeNode, DonutTooltip, SimpleNode } from './utils/DonutUtils';
import { scaleLinear, scaleSqrt, ScaleLinear, ScalePower } from 'd3-scale';
import { arc, Arc, DefaultArcObject } from 'd3-shape';
import { select, pointer, BaseType, Selection } from 'd3-selection';
import { hierarchy, partition, HierarchyNode } from 'd3-hierarchy';
import { interpolate } from 'd3-interpolate';

export const NO_VALUE = 'No value';

export abstract class AbstractDonut {
  public donutParams: DonutParams;
  public donutDimensions: DonutDimensions;
  protected donutContext: Selection<SVGElement, TreeNode, BaseType, TreeNode>;
  // protected svgNode: any;
  protected lastSelectedNode: DonutNode = null;
  protected arc: Arc<AbstractDonut, DefaultArcObject>;
  protected x: ScaleLinear<number, number>;
  protected y: ScalePower<number, number>;
  protected donutTooltip: DonutTooltip = {
    xPosition: null, yPosition: null, nodeName: null, nodeParents: null,
    nodeCount: null, nodeColor: null
  };

  /**
   * @description Plots the donut
   */
  public plot(): void {
    if (this.donutContext) {
      this.donutContext.remove();
    }
    this.initializeDonutDimensions();
    this.createDonutArcs();
    this.structureDataToNodes();
    this.plotDonut();
  }

  /**
  * @description Resizes donut on window resize event.
  */
  public resize(donutContainer: HTMLElement): void {
    this.donutParams.donutContainer = donutContainer;
    this.plot();
    this.reapplySelection();
    this.styleNodes();
  }

  public abstract dataChange(newData: TreeNode): void;
  public abstract onSelectionChange(selectedArcsList: Array<Array<SimpleNode>>): void;



  /**
   * @description Creates donuts arcs
   */
  protected createDonutArcs(): void {
    this.x = scaleLinear().range([0, 2 * Math.PI]);
    this.y = scaleSqrt().range([0, this.donutDimensions.radius]);
    this.arc = arc()
      .startAngle((d) => Math.max(0, Math.min(2 * Math.PI, this.x(d.startAngle))))
      .endAngle((d) => Math.max(0, Math.min(2 * Math.PI, this.x(d.endAngle))))
      .innerRadius((d) => Math.max(0, this.y(d.innerRadius)))
      .outerRadius((d) => Math.max(0, this.y(d.outerRadius)));
  }

  /**
   * @description Inialize donuts dimensions
   */
  protected initializeDonutDimensions(): void {
    let width = this.donutParams.donutContainer.offsetWidth;
    let height = this.donutParams.donutContainer.offsetHeight;
    if (this.donutParams.diameter !== null && this.donutParams.diameter !== undefined) {
      width = height = this.donutParams.diameter;
    }

    let containerWidth = width;
    if (this.donutParams.containerWidth !== null && this.donutParams.containerWidth !== undefined) {
      containerWidth = this.donutParams.containerWidth;
    }

    const radius = Math.min(width, height) / 2;
    const svg = select<SVGElement, TreeNode>(this.donutParams.svgElement)
      .attr('class', 'donut__svg')
      .attr('width', width)
      .attr('height', height);
    this.donutDimensions = { svg, width, containerWidth, height, radius };
  }

  /**
   * @description Transforms input data to d3 nodes
   */
  protected structureDataToNodes(): void {
    const sumSize = this.donutParams.donutData.children.map(c => c.size).reduce((val, acc) => acc + val, 0);
    if (this.donutParams.donutData.size && sumSize < this.donutParams.donutData.size) {
      const fieldName = this.donutParams.donutData.children[0]?.fieldName;
      this.donutParams.donutData.children.push({
        id: fieldName + NO_VALUE.replace(' ', ''),
        fieldName: fieldName,
        fieldValue: NO_VALUE,
        size: this.donutParams.donutData.size - sumSize,
        metricValue: this.donutParams.donutData.size - sumSize,
        isOther: true,
        children: [],
        color: '#ffffff'
      });
    }
    const root: HierarchyNode<TreeNode> = hierarchy(this.donutParams.donutData)
      .sum(d => {
        if (d.size !== undefined && d.size !== null) {
          if (d.children !== undefined && d.children !== null && d.children.length > 0) {
            return d.size - d.children?.map(node => node.size ? node.size : 0).reduce((val, acc) => acc + val);
          }
          return d.size;
        } else {
          throw new Error('The node size of ' + d.fieldValue + ' is not specified');
        }
      })
      .sort((a, b) => b.value - a.value);
    const part = partition();
    this.donutParams.donutNodes = <Array<DonutNode>>part(root).descendants();
    this.donutParams.donutNodes.forEach(d => {
      d.isSelected = false;
      d.startAngle = d.x0;
      d.endAngle = d.x1;
      d.innerRadius = d.y0;
      d.outerRadius = d.y1;
    });
  }

  /**
   * @description Draws the donuts arcs
   */
  protected plotDonut(): void {
    this.donutContext = this.donutDimensions.svg
      .append('g')
      .attr('class', 'donut__arc--container')
      .attr('transform', 'translate(' + this.donutDimensions.width / 2 + ',' + this.donutDimensions.height / 2 + ')')
      .on('mouseleave', () => this.onMouseLeavesContext());
    const path = this.donutContext.selectAll('path')
      .data(this.donutParams.donutNodes)
      .enter().append('path')
      .attr('class', 'donut__arc')
      .style('fill', (d) => DonutUtils.getNodeColor(d, this.donutParams.donutNodeColorizer,
        this.donutParams.keysToColors, this.donutParams.colorsSaturationWeight))
      .style('opacity', 1)
      .attr('d', d => this.arc(d))
      .on('click', (event, clickedNode) => this.onClick(event, clickedNode))
      .on('mouseover', (event, hoveredNode) => this.onMouseOver(event, hoveredNode))
      .on('mousemove', (event) => this.setTooltipPosition(event))
      .on('mouseout', (d) => this.onMouseOut());
  }

  /**
   * @param clickedNode The selected node on the donut
   * @description Add the selected node to selectedArcsList
   */
  protected addSelectedNode(clickedNode: DonutNode): void {
    let hasSelectedChild = false;
    if (clickedNode.children !== undefined) {
      clickedNode.children.every(child => {
        hasSelectedChild = (<DonutNode>child).isSelected;
        return !(<DonutNode>child).isSelected;
      });
    }
    if (!hasSelectedChild) {
      clickedNode.isSelected = true;
      this.donutParams.selectedArcsList.push(DonutUtils.getNodePathAsArray(clickedNode));
    }
  }

  /**
   * @param clickedNode The unselected node from the donut
   * @description Removes the selected node from selectedArcsList
   */
  protected removeSelectedNode(clickedNode: DonutNode): void {
    clickedNode.isSelected = false;
    let nodeIndex = null;
    let nodeAsPath;
    for (let i = 0; i < this.donutParams.selectedArcsList.length; i++) {
      const node = DonutUtils.getNode(this.donutParams.selectedArcsList[i], this.donutParams.donutNodes);
      if (node === clickedNode) {
        nodeIndex = i;
        nodeAsPath = this.donutParams.selectedArcsList[i];
        break;
      }
    }
    this.donutParams.selectedArcsList.splice(nodeIndex, 1);
    this.removeAllSimilarNodesOfSameRing(nodeAsPath);
  }

  /**
   * @param clickedNode The selected/unselected node of the donut
   * @description Removes from selectArcsList all the parent nodes of the clicked node that are selected
  */
  protected removeHigherNodes(clickedNode: DonutNode): void {
    const nodeAsArray = DonutUtils.getNodePathAsArray(clickedNode);
    const listOfHigherNodesToRemove = [];
    while (nodeAsArray.length > 1) {
      nodeAsArray.shift();
      const higherNode = DonutUtils.getNode(nodeAsArray, this.donutParams.donutNodes);
      this.donutParams.selectedArcsList.forEach(selectedArc => {
        if (selectedArc.length === nodeAsArray.length) {
          const selectedNode = DonutUtils.getNode(selectedArc, this.donutParams.donutNodes);
          if (higherNode === selectedNode) {
            listOfHigherNodesToRemove.push(this.donutParams.selectedArcsList.indexOf(selectedArc));
          }
        }
      });
    }
    for (let i = 0; i < listOfHigherNodesToRemove.length; i++) {
      this.donutParams.selectedArcsList.splice(listOfHigherNodesToRemove[i] - i, 1);
    }
  }

  /**
   * @description Removes the unexisting nodes in the donut from the selectedArcsList
   */
  protected removeUnExistingNodes(): void {
    const listUnExistingNodesToRemove = [];
    this.donutParams.selectedArcsList.forEach(a => {
      if (DonutUtils.getNode(a, this.donutParams.donutNodes) === null) {
        listUnExistingNodesToRemove.push(this.donutParams.selectedArcsList.indexOf(a));
      }
    });
    for (let i = 0; i < listUnExistingNodesToRemove.length; i++) {
      this.donutParams.selectedArcsList.splice(listUnExistingNodesToRemove[i] - i, 1);
    }
  }

  /**
   * @param selectedArc Path from the selected arc to the ultimate parent (as an array)
   * @description REMOVES ALL THE NODES OF SAME RING HAVING THE SAME VALUE FROM THE SELECTEDARCSLIST,
   */
  protected removeAllSimilarNodesOfSameRing(selectedArc: Array<SimpleNode>): void {
    const listNodesToRemove = [];
    for (let i = 0; i < this.donutParams.selectedArcsList.length; i++) {
      const a = this.donutParams.selectedArcsList[i];
      if (a.length === selectedArc.length && a[0].fieldName === selectedArc[0].fieldName && a[0].fieldValue === selectedArc[0].fieldValue) {
        listNodesToRemove.push(i);
      }
    }
    for (let i = 0; i < listNodesToRemove.length; i++) {
      this.donutParams.selectedArcsList.splice(listNodesToRemove[i] - i, 1);
    }
  }

  /**
   * @description Set isSelected attribute to false for all the donut's nodes
   */
  protected deselectAll(): void {
    this.donutParams.donutNodes.forEach(node => {
      node.isSelected = false;
    });
  }

  /**
   * @description Set isSelected attribute to true giving the selectedArcsList
   */
  protected reapplySelection(): void {
    this.donutParams.selectedArcsList.forEach((nodePath) => {
      const node = DonutUtils.getNode(nodePath, this.donutParams.donutNodes);
      if (node !== null) {
        node.isSelected = true;
      }
    });
  }

  /**
   * @description Styles the nodes according to their states
   */
  protected styleNodes(): void {
    if (this.donutParams.selectedArcsList.length > 0) {
      /** fixing values of opacity between [0 and 100] and transform them to [0 and 1] */
      let donutOpacity = this.donutParams.opacity;
      if (donutOpacity > 1) {
        donutOpacity = this.donutParams.opacity / 100;
      }
      this.donutContext.selectAll('path').style('opacity', donutOpacity).style('stroke-width', '0.5px');

      this.donutParams.donutNodes.forEach(node => {
        if (node.isSelected) {
          const nodeAncestors = node.ancestors().reverse();
          this.donutContext
            .selectAll<SVGElement, DonutNode>('path')
            .filter((n) => nodeAncestors.indexOf(n) >= 0)
            .style('opacity', 1)
            .style('stroke-width', '1.5px');
        }
      });
    } else {
      this.donutContext.selectAll('path').style('opacity', 1).style('stroke-width', '0.5px');
    }
    this.styleNoValueNode();
  }

  /**
   * @description Styles the 'No value' node
   */
  private styleNoValueNode() {
    this.donutContext.selectAll<SVGElement, DonutNode>('path')
      .filter((n) => n.data.fieldValue === NO_VALUE)
      .style('stroke-width', '0.25px')
      .style('stroke-dasharray', ('10,5'))
      .style('stroke', '#000000');
  }

  /**
   * @param node Clicked on node
   * @param duration Duration of the animation
   * @description Apply animation after clicking on the node.
   */
  protected tweenNode(node: DonutNode, duration: number): void {
    this.donutContext.transition()
      .duration(duration)
      .tween('scale', () => {
        const xd = interpolate(this.x.domain(), [node.x0, node.x1]);
        const yd = interpolate(this.y.domain(), [node.y0, 1]);
        const yr = interpolate(this.y.range(), [node.y0 ? 20 : 0, this.donutDimensions.radius]);
        return (t) => {
          this.x.domain(xd(t)); this.y.domain(yd(t)).range(yr(t));
        };
      })
      .selectAll('path')
      .attrTween('d', (d: DefaultArcObject) => (() => this.arc(d)));
  }

  protected onMouseOver(event: MouseEvent, hoveredNode: DonutNode): void {
    this.showTooltip(hoveredNode);
    const hoveredNodeAncestors = <Array<DonutNode>>hoveredNode.ancestors().reverse();
    hoveredNodeAncestors.shift();
    this.hoverNode(hoveredNode);
    this.donutContext
      .selectAll<SVGElement, DonutNode>('path')
      .filter((node) => hoveredNodeAncestors.indexOf(node) >= 0)
      .style('opacity', 1);
    const arcColorMap = new Map<string, string>();
    this.donutTooltip.nodeParents = new Array<string>();
    hoveredNodeAncestors.forEach(node => {
      arcColorMap.set(node.data.fieldName, DonutUtils.getNodeColor(node, this.donutParams.donutNodeColorizer,
        this.donutParams.keysToColors, this.donutParams.colorsSaturationWeight));
      this.donutTooltip.nodeParents.unshift(node.data.fieldName);
    });
    this.donutParams.hoveredNodesEvent.next(arcColorMap);
    this.donutTooltip.nodeName = hoveredNode.data.fieldValue;
    this.donutTooltip.nodeCount = hoveredNode.value;
    this.donutTooltip.nodeColor = DonutUtils.getNodeColor(hoveredNode, this.donutParams.donutNodeColorizer,
      this.donutParams.keysToColors, this.donutParams.colorsSaturationWeight);
  }

  protected onMouseOut(): void {
    this.donutParams.tooltip.isShown = false;
    this.donutParams.hoveredNodeTooltipEvent.next(null);
    this.donutParams.tooltipEvent.next(null);
    this.unhoverNodesButNotSelected();
  }

  protected onMouseLeavesContext(): void {
    this.donutParams.hoveredNodesEvent.next(new Map<string, string>());
  }

  protected showTooltip(node: DonutNode): void {
    this.donutParams.tooltip.isShown = true;
    this.donutParams.tooltip.content = DonutUtils.getNodeToolipAsArray(node,
      this.donutParams.donutNodeColorizer,
      this.donutParams.keysToColors, this.donutParams.colorsSaturationWeight
    );
  }

  protected setTooltipPosition(event) {
    const xPosition = this.donutDimensions.containerWidth / 2 + pointer(event)[0];
    if (xPosition > this.donutDimensions.containerWidth / 2) {
      this.donutParams.tooltip.isRightSide = true;
      this.donutParams.tooltip.xPosition = this.donutDimensions.containerWidth / 2 - xPosition + 60;
    } else {
      this.donutParams.tooltip.isRightSide = false;
      this.donutParams.tooltip.xPosition = xPosition + 20;
    }
    this.donutParams.tooltip.yPosition = pointer(event)[1] - 5 + (this.donutDimensions.height / 2);
    this.donutTooltip.xPosition = xPosition;
    this.donutTooltip.yPosition = this.donutParams.tooltip.yPosition;
    if (this.donutParams.tooltip.isShown) {
      this.donutParams.hoveredNodeTooltipEvent.next(this.donutTooltip);
      this.donutParams.tooltipEvent.next(this.donutParams.tooltip);
    }
  }

  protected abstract hoverNode(hoveredNode: DonutNode);
  protected abstract unhoverNodesButNotSelected();
  protected abstract onClick(event: PointerEvent, clickedNode: DonutNode): void;
}
