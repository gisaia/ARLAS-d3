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
import { HistogramData, SwimlaneStats, SwimlaneRepresentation } from '../utils/HistogramUtils';

export class SwimlaneCircles extends AbstractSwimlane {

  protected plotOneLane(data: Array<HistogramData>, indexOfLane: number): void {
    const swimStats: SwimlaneStats = this.histogramParams.swimlaneData.stats;
    const swimRepresentation: SwimlaneRepresentation = this.histogramParams.swimlaneRepresentation;
    const swimColors = this.histogramParams.paletteColors;
    const swimOptions = this.histogramParams.swimlaneOptions;
    this.barsContext = this.context.append('g')
      .attr('class', 'histogram__swimlane').selectAll('dot').data(data).enter().append('circle')
      .attr('r', (d) => this.getBucketRadius(d, swimStats, swimRepresentation))
      .attr('cx', (d) => this.histogramParams.swimLaneLabelsWidth + this.swimlaneAxes.xDataDomainArray[indexOfLane]((+d.key).toString()) +
        this.swimlaneAxes.stepWidth * this.histogramParams.barWeight / 2)
      .attr('cy', (d) => this.histogramParams.swimlaneHeight * (indexOfLane + 1) - this.histogramParams.swimlaneHeight / 2)
      .attr('class', 'histogram__swimlane--circle')
      .style('fill', (d) => this.getBucketColor(d, swimOptions, swimStats, swimRepresentation, swimColors))
      .style('stroke', (d) => this.getBucketColor(d, swimOptions, swimStats, swimRepresentation, swimColors))
      .style('opacity', '0.8');
  }

  private getBucketRadius(bucket: HistogramData, swimStats: SwimlaneStats, representation: SwimlaneRepresentation): number {
    const globalMax = Math.max(Math.abs(swimStats.globalStats.max), Math.abs(swimStats.globalStats.min));
    const bucketValue = bucket.value.toString() !== NaN.toString() ? +bucket.value : 0;
    const fixedCoefficient = Math.min(this.swimlaneAxes.stepWidth, this.histogramParams.swimlaneHeight) * this.swimlaneBarsWeight;
    if (representation === SwimlaneRepresentation.global) {
      return Math.sqrt(Math.abs(bucketValue) / globalMax) * 3 / 5 * fixedCoefficient;
    } else {
      const bucketSum = swimStats.columnStats.get(+bucket.key).sum;
      if (bucketSum === 0) {
        return 0;
      } else {
        return Math.sqrt(bucketValue / bucketSum) * 3 / 5 * fixedCoefficient;
      }
    }
  }
}
