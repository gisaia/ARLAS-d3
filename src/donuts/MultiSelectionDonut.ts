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
import { DonutNode, TreeNode, SimpleNode } from './utils/DonutUtils';

export class MultiSelectionDonut extends AbstractDonut {

  public onSelectionChange(selectedArcsList: Array<Array<SimpleNode>>) {
    this.donutParams.selectedArcsList = selectedArcsList;
    this.deselectAll();
    this.reapplySelection();
    this.styleNodes();
  }

  public dataChange(newData: TreeNode): void {
    this.donutParams.donutData = newData;
    this.plot();
    this.reapplySelection();
    this.styleNodes();
  }

  protected hoverNode(hoveredNode: DonutNode) {
    /** fixing values of opacity between [0 and 100] and transform them to [0 and 1] */
    let donutOpacity = this.donutParams.opacity;
    if (donutOpacity > 1) {
      donutOpacity = this.donutParams.opacity / 100;
    }
    if (this.donutParams.selectedArcsList.length === 0 && hoveredNode.depth > 0 && !hoveredNode.data.isOther) {
      this.donutContext.selectAll('path').style('opacity', donutOpacity);
    }
  }
  protected unhoverNodesButNotSelected() {
    this.styleNodes();
  }

  protected onClick(event: PointerEvent, clickedNode: DonutNode) {
    this.removeHigherNodes(clickedNode);
    this.donutParams.donutNodes[0].isSelected = false;
    if (clickedNode.depth > 0 && !clickedNode.data.isOther) {
      if (!clickedNode.isSelected) {
        this.addSelectedNode(clickedNode);
      } else {
        this.removeSelectedNode(clickedNode);
      }
      this.styleNodes();
      this.donutParams.selectedNodesEvent.next(this.donutParams.selectedArcsList);
    } else if (clickedNode.depth === 0) {
      if (!clickedNode.isSelected && this.donutParams.selectedArcsList.length > 0) {
        clickedNode.isSelected = true;
        this.donutParams.selectedArcsList = [];
        this.deselectAll();
        this.styleNodes();
        this.donutParams.selectedNodesEvent.next(this.donutParams.selectedArcsList);
      }
    }
  }


}
