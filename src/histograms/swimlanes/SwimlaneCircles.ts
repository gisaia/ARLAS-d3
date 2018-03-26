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

import * as tinycolor from 'tinycolor2';

import { AbstractSwimlane } from './AbstractSwimlane';
import { HistogramData, HistogramUtils } from '../utils/HistogramUtils';

export class SwimlaneCircles extends AbstractSwimlane {

  protected plotOneLane(data: Array<HistogramData>, indexOfLane): void {
    this.barsContext = this.context.append('g')
    .attr('class', 'histogram__swimlane').selectAll('dot').data(data).enter().append('circle')
    .attr('r', (d) => Math.min(this.swimlaneAxes.stepWidth, this.histogramParams.swimlaneHeight) * this.histogramParams.barWeight *
      Math.sqrt(d.value / this.swimlaneMaxValue) / 2)
    .attr('cx', (d) => this.histogramParams.swimLaneLabelsWidth + this.swimlaneAxes.xDataDomainArray[indexOfLane](d.key) +
      this.swimlaneAxes.stepWidth * this.histogramParams.barWeight / 2)
    .attr('cy', (d) => this.histogramParams.swimlaneHeight * (indexOfLane + 1) - this.histogramParams.swimlaneHeight / 2)
    .attr('class', 'histogram__swimlane--circle')
    .style('fill', (d) => HistogramUtils.getColor(d.value / this.swimlaneMaxValue, this.histogramParams.paletteColors).toHexString())
    .style('stroke', (d) => HistogramUtils.getColor(d.value / this.swimlaneMaxValue, this.histogramParams.paletteColors).toHexString())
    .style('opacity', '0.8');
  }
}
