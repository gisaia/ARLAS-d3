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

import { AbstractDonut } from './AbstractDonut';
import { DonutNode, DonutUtils, TreeNode, SimpleNode } from './utils/DonutUtils';

export class OneSelectionDonut extends AbstractDonut {

  public dataChange(newData: TreeNode): void {
    this.donutParams.donutData = newData;
    this.plot();
    if (this.donutParams.selectedArcsList.length === 1) {
      const selectedNode = DonutUtils.getNode(this.donutParams.selectedArcsList[0], this.donutParams.donutNodes);
      if (selectedNode !== null) {
        selectedNode.isSelected = true;
        this.tweenNode(selectedNode, 750);
      }
    }
  }

  public onSelectionChange(selectedArcsList: Array<Array<SimpleNode>>) {
    this.donutParams.selectedArcsList = selectedArcsList;
    if (this.donutParams.selectedArcsList.length === 1) {
      this.deselectAll();
      const selectedNode = DonutUtils.getNode(this.donutParams.selectedArcsList[0], this.donutParams.donutNodes);
      if (selectedNode !== null) {
        selectedNode.isSelected = true;
        this.tweenNode(selectedNode, 750);
      }
    }
  }

  protected hoverNode(hoveredNode: DonutNode) {
    const opacity = (hoveredNode.depth > 0) ? 0.2 : 1;
    this.donutContext.selectAll('path').style('opacity', opacity);
  }

  protected unhoverNodesButNotSelected() {
    this.donutContext.selectAll('path').style('opacity', 1);
  }

  protected onClick(clickedNode: DonutNode) {
    if (clickedNode.depth > 0 && !clickedNode.data.isOther) {
      this.donutParams.donutNodes[0].isSelected = false;

      if (!clickedNode.isSelected) {
        clickedNode.isSelected = true;
        if (this.lastSelectedNode !== null) {
          this.lastSelectedNode.isSelected = false;
        }
        this.donutParams.selectedArcsList = [DonutUtils.getNodePathAsArray(clickedNode)];
        this.tweenNode(clickedNode, 750);
        this.lastSelectedNode = clickedNode;
      } else {
        clickedNode.isSelected = false;
        this.donutParams.selectedArcsList = [];
        this.lastSelectedNode.isSelected = false;
        this.lastSelectedNode = null;
        this.tweenNode(this.donutParams.donutNodes[0], 750);
      }
      this.donutParams.selectedNodesEvent.next(this.donutParams.selectedArcsList);
    } else  if (clickedNode.depth === 0) {
      if (!clickedNode.isSelected && this.donutParams.selectedArcsList.length > 0) {
        clickedNode.isSelected = true;
        this.donutParams.selectedArcsList = [];
        this.lastSelectedNode.isSelected = false;
        this.lastSelectedNode = null;
        this.tweenNode(clickedNode, 750);
        this.donutParams.selectedNodesEvent.next(this.donutParams.selectedArcsList);
      }
    }
  }

}
