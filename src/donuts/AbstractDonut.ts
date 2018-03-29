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
import { DonutNode, DonutDimensions, DonutUtils, DonutArc } from './utils/DonutUtils';

import * as d3 from 'd3';

export abstract class AbstractDonut {
  public donutParams: DonutParams;
  public donutDimensions: DonutDimensions;


  protected donutContext: any;
  protected svgNode: any;
  protected lastSelectedNode: DonutNode = null;
  protected arc: d3.Arc<any, d3.DefaultArcObject>;
  protected x: d3.ScaleLinear<number, number>;
  protected y: d3.ScalePower<number, number>;

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
  public resizeDonut(e: Event): void {
    this.donutParams.donutContainer = document.getElementById(this.donutParams.id);
    this.plot();
    this.reapplySelection();
    this.styleNodes();
  }

  public abstract dataChange(newData: DonutArc): void;
  public abstract onSelectionChange(selectedArcsList: Array<Array<{ringName: string, name: string}>>): void;



  /**
   * @description Creates donuts arcs
   */
  protected createDonutArcs(): void {
    this.x = d3.scaleLinear().range([0, 2 * Math.PI]);
    this.y = d3.scaleSqrt().range([0, this.donutDimensions.radius]);
    this.arc = d3.arc()
      .startAngle((d) => Math.max(0, Math.min(2 * Math.PI, this.x(d.startAngle))))
      .endAngle((d) => Math.max(0, Math.min(2 * Math.PI, this.x(d.endAngle))))
      .innerRadius((d) => Math.max(0, this.y(d.innerRadius)))
      .outerRadius((d) => Math.max(0, this.y(d.outerRadius)));
  }

  /**
   * @description Inialize donuts dimensions
   */
  protected initializeDonutDimensions(): void {
    const width = this.donutParams.donutContainer.offsetWidth;
    const height = this.donutParams.donutContainer.offsetHeight;
    const radius = Math.min(width, height) / 2;
    const svg = d3.select(this.donutParams.svgElement)
      .attr('class', 'donut__svg')
      .attr('width', width)
      .attr('height', height);
    this.donutDimensions = { svg, width, height, radius };
  }

  /**
   * @description Transforms input data to d3 nodes
   */
  protected structureDataToNodes(): void {
    const root: d3.HierarchyNode<any> = d3.hierarchy(this.donutParams.donutData)
      .sum((d) => d.size)
      .sort((a, b) => b.value - a.value);
    const partition = d3.partition();
    this.donutParams.donutNodes = <Array<DonutNode>>partition(root).descendants();
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
      .style('fill', (d) => DonutUtils.getNodeColor(d))
      .style('opacity', 1)
      .attr('d', this.arc)
      .on('click', (d) => this.onClick(d))
      .on('mouseover', (d) =>  this.onMouseOver(d))
      .on('mousemove', (d) => this.setTooltipPosition())
      .on('mouseout', (d) => this.onMouseOut());
  }

  /**
   * @param clickedNode The selected node on the donut
   * @description Add the selected node to selectedArcsList
   */
  protected addSelectedNode(clickedNode: DonutNode): void  {
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
     this.donutParams.selectedArcsList.forEach(arc => {
       if (DonutUtils.getNode(arc, this.donutParams.donutNodes) === null) {
         listUnExistingNodesToRemove.push(this.donutParams.selectedArcsList.indexOf(arc));
       }
     });
     for (let i = 0; i < listUnExistingNodesToRemove.length; i++) {
       this.donutParams.selectedArcsList.splice(listUnExistingNodesToRemove[i] - i, 1);
     }
  }

  /**
   * @param selectedArc Path from the selected arc to the ultimate parent (as an array)
   * @description REMOVES ALL THE NODES OF SAME RING HAVING THE SAME VALUE FROM THE SELECTEDARCSLIST,
   * ONLY IF THERE IS A DIFFERENT VALUE ALREADY SELECTED ON THIS RING
   */
  protected removeAllSimilarNodesOfSameRing(selectedArc: Array<{ringName: string, name: string}>): void {
    const listNodesToRemove = [];
    let removeAll = false;
    for (let i = 0; i < this.donutParams.selectedArcsList.length; i++) {
      const arc = this.donutParams.selectedArcsList[i];
      if (arc.length === selectedArc.length && arc[0].ringName === selectedArc[0].ringName && arc[0].name !== selectedArc[0].name) {
        removeAll = true;
        break;
      }
    }

    if (removeAll) {
      for (let i = 0; i < this.donutParams.selectedArcsList.length; i++) {
        const arc = this.donutParams.selectedArcsList[i];
        if (arc.length === selectedArc.length && arc[0].ringName === selectedArc[0].ringName && arc[0].name === selectedArc[0].name) {
          listNodesToRemove.push(i);
        }
      }
    }
    for (let i  = 0; i < listNodesToRemove.length; i++) {
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
  protected reapplySelection (): void {
    this.donutParams.selectedArcsList.forEach ((nodePath) => {
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
      this.donutContext.selectAll('path').style('opacity', this.donutParams.opacity).style('stroke-width', '0px');
      this.donutParams.donutNodes.forEach(node => {
        if (node.isSelected) {
          const nodeAncestors = node.ancestors().reverse();
          this.donutContext
            .selectAll('path')
            .filter((n) => nodeAncestors.indexOf(n) >= 0)
            .style('opacity', 1)
            .style('stroke-width', '0.5px');
        }
      });
    } else {
      this.donutContext.selectAll('path').style('opacity', 1).style('stroke-width', '0px');
    }
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
        const xd = d3.interpolate(this.x.domain(), [node.x0, node.x1]);
        const yd = d3.interpolate(this.y.domain(), [node.y0, 1]);
        const yr = d3.interpolate(this.y.range(), [node.y0 ? 20 : 0, this.donutDimensions.radius]);
        return (t) => { this.x.domain(xd(t)); this.y.domain(yd(t)).range(yr(t)); };
      })
      .selectAll('path')
      .attrTween('d', (d) => (() => this.arc(d)));
  }

  protected onMouseOver(hoveredNode: DonutNode): void {
    this.showTooltip(hoveredNode);
    const hoveredNodeAncestors = <Array<DonutNode>>hoveredNode.ancestors().reverse();
    hoveredNodeAncestors.shift();
    this.hoverNode(hoveredNode);
    this.donutContext
      .selectAll('path')
      .filter((node) => hoveredNodeAncestors.indexOf(node) >= 0)
      .style('opacity', 1);
    const arcColorMap = new Map<string, string>();
    hoveredNodeAncestors.forEach(node => {
      arcColorMap.set(node.data.name, DonutUtils.getNodeColor(node));
    });
    this.donutParams.hoveredNodesEvent.next(arcColorMap);
  }

  protected onMouseOut(): void {
    this.donutParams.tooltip.isShown = false;
    this.unhoverNodesButNotSelected();
  }

  protected onMouseLeavesContext(): void {
    this.donutParams.hoveredNodesEvent.next(new Map<string, string>());
  }

  protected showTooltip(node: DonutNode): void {
    this.donutParams.tooltip.isShown = true;
    this.donutParams.tooltip.xContent = DonutUtils.getNodePathAsString(node) + ' (' + node.value + ')';
  }

  protected setTooltipPosition() {
    const xPosition = this.donutDimensions.width / 2 + d3.mouse(<d3.ContainerElement>this.donutContext.node())[0];
    if (xPosition > this.donutDimensions.width / 2) {
      this.donutParams.tooltip.isRightSide = true;
      this.donutParams.tooltip.xPosition = this.donutDimensions.width - xPosition + 10;
    } else {
      this.donutParams.tooltip.isRightSide = false;
      this.donutParams.tooltip.xPosition = xPosition + 15;
    }
    this.donutParams.tooltip.yPosition = d3.mouse(<d3.ContainerElement>this.donutContext.node())[1] - 5 + (this.donutDimensions.height / 2);
  }

  protected abstract hoverNode(hoveredNode: DonutNode);
  protected abstract unhoverNodesButNotSelected();
  protected abstract onClick(clickedNode: DonutNode): void;
}