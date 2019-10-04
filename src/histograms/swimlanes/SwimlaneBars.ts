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

import { AbstractSwimlane } from './AbstractSwimlane';
import { HistogramData, HistogramUtils, SwimlaneMode } from '../utils/HistogramUtils';

export class SwimlaneBars extends AbstractSwimlane {

  protected plotOneLane(data: Array<HistogramData>, indexOfLane): void {
    this.plotBars(data, this.swimlaneAxes, this.swimlaneAxes.xDataDomainArray[indexOfLane], this.swimlaneBarsWeight);
    this.barsContext
      .attr('rx', this.histogramParams.swimlaneBorderRadius)
      .attr('ry', this.histogramParams.swimlaneBorderRadius)
      .attr('y', this.histogramParams.swimlaneHeight * (indexOfLane))
      .attr('height', (d) => this.getSwimlaneContentHeight(d.value))
      .attr('transform', (d) => 'translate(' + this.histogramParams.swimLaneLabelsWidth + ','
      + this.getSwimlaneVerticalTranslation(d.value, indexOfLane) + ')')
      .style('fill', (d) => HistogramUtils.getColor(d.value / this.swimlaneMaxValue, this.histogramParams.paletteColors).toHexString())
      .style('stroke', (d) => HistogramUtils.getColor(d.value / this.swimlaneMaxValue, this.histogramParams.paletteColors).toHexString())
      .style('opacity', '0.8');

    if (this.histogramParams.swimlaneMode === SwimlaneMode.fixedHeight) {
      this.plotHorizontalTicksForSwimlane(data, indexOfLane);
    }
  }

  private getSwimlaneContentHeight(swimlaneValue?: number): number {
    return (this.histogramParams.swimlaneMode === SwimlaneMode.fixedHeight) ? this.histogramParams.swimlaneHeight - 5 :
      swimlaneValue * this.histogramParams.swimlaneHeight / this.swimlaneMaxValue;
  }

  private getSwimlaneVerticalTranslation(swimlaneValue?: number, indexOfSwimlane?: number): number {
    return (this.histogramParams.swimlaneMode === SwimlaneMode.fixedHeight) ? 5 :
      this.histogramParams.swimlaneHeight - swimlaneValue * this.histogramParams.swimlaneHeight / this.swimlaneMaxValue;
  }

  private plotHorizontalTicksForSwimlane(data: Array<HistogramData>, index: number) {
    this.context.append('g').attr('class', 'histogram__swimlane-height')
      .selectAll('path')
      .data(data)
      .enter().append('line').attr('class', 'histogram__swimlane-height--tick')
      .attr('x1', (d) => this.histogramParams.swimLaneLabelsWidth + this.swimlaneAxes.xDataDomainArray[index](d.key))
      .attr('y1', (d) => this.getHorizontalTickHeight(d.value, index))
      .attr('x2', (d) => this.histogramParams.swimLaneLabelsWidth + this.swimlaneAxes.xDataDomainArray[index](d.key) +
        this.swimlaneAxes.stepWidth * this.histogramParams.barWeight)
      .attr('y2', (d) => this.getHorizontalTickHeight(d.value, index));
  }

  private getHorizontalTickHeight(dataValue: any, i: number): number {
    const value = dataValue !== NaN.toString() ? + dataValue : 0;
    return this.histogramParams.swimlaneHeight * (i + 1) - (+value) * (this.histogramParams.swimlaneHeight - 5) / (+this.swimlaneMaxValue);
  }
}
