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
import { HistogramData, HistogramUtils, SwimlaneMode, LaneStats,
   SwimlaneStats, SwimlaneRepresentation, SwimlaneOptions, NAN_COLOR, TICK_WIDTH, TICK_OPACITY, TICK_COLOR } from '../utils/HistogramUtils';

export class SwimlaneBars extends AbstractSwimlane {

  protected plotOneLane(laneData: Array<HistogramData>, indexOfLane): void {
    const swimStats: SwimlaneStats = this.histogramParams.swimlaneData.stats;
    const swimRepresentation: SwimlaneRepresentation = this.histogramParams.swimlaneRepresentation;
    const swimColors = this.histogramParams.paletteColors;
    const swimMode = this.histogramParams.swimlaneMode;
    const swimHeight = this.histogramParams.swimlaneHeight * 0.9;
    const swimOptions = this.histogramParams.swimlaneOptions;
    this.plotBars(laneData, this.swimlaneAxes, this.swimlaneAxes.xDataDomainArray[indexOfLane], this.swimlaneBarsWeight);
    this.barsContext
      .attr('rx', this.histogramParams.swimlaneBorderRadius)
      .attr('ry', this.histogramParams.swimlaneBorderRadius)
      .attr('y', this.histogramParams.swimlaneHeight * (indexOfLane))
      .attr('height', (d) => this.getBucketHeight(d, swimStats, swimRepresentation, swimMode, swimHeight))
      .attr('transform', (d) => 'translate(' + this.histogramParams.swimLaneLabelsWidth + ','
      + this.getSwimlaneVerticalTranslation(d, swimStats, swimRepresentation, swimMode, swimHeight) + ')')
      .style('fill', (d) => this.getBucketColor(d, swimOptions, swimStats, swimRepresentation, swimColors))
      .style('stroke', (d) =>  this.getBucketColor(d, swimOptions, swimStats, swimRepresentation, swimColors))
      .style('opacity', '0.8');

    if (this.histogramParams.swimlaneMode === SwimlaneMode.fixedHeight) {
      this.plotLevelTicks(laneData, swimOptions, indexOfLane);
    }
  }

  /**
   * Returns the height of the bucket
   * @param bucket the bucket to be plotted
   * @param swimStats stats of the swimlane used to put `bucket` in the context of all the data
   * @param representation what information to represent:
   * - `column`: the bucket value is compared to other values of the same column (vertical lane)
   * - `global`: the bucket value is compated to all data.
   * @param swimMode which mode to represent
   * - fixedHeight: in this case, laneHeight is returned
   * - varaibleHeight: the height depends on the bucket value representation (column or global).
   * @param laneHeight The height of the lane
   */
  private getBucketHeight(bucket: HistogramData, swimStats: SwimlaneStats, representation: SwimlaneRepresentation,
    swimMode: SwimlaneMode, laneHeight: number): number {
    const globalMax = swimStats.globalStats.max;
    if (swimMode === SwimlaneMode.fixedHeight) {
      return laneHeight;
    } else {
      const value = bucket.value.toString() !== NaN.toString() ? +bucket.value : 0;
      if (representation === SwimlaneRepresentation.global) {
        return value / globalMax * laneHeight;
      } else {
        const bucketSum = swimStats.columnStats.get(+bucket.key).sum;
        if (bucketSum === 0) {
          return 0;
        } else {
          return value / bucketSum * laneHeight;
        }
      }
    }
  }

  private getSwimlaneVerticalTranslation(bucket: HistogramData, swimStats: SwimlaneStats, representation: SwimlaneRepresentation,
    swimMode: SwimlaneMode, laneHeight: number): number {
    if (this.histogramParams.swimlaneMode === SwimlaneMode.fixedHeight) {
      return laneHeight * 1 / 9;
    } else {
      return laneHeight * 1 / 9 + (laneHeight - this.getBucketHeight(bucket, swimStats, representation, swimMode, laneHeight));    }
  }

  /**
   * Plots a tick on each swimlane bucket that indicates how high/low the bucket value is.
   * @param laneData Data of a lane
   * @param index
   */
  private plotLevelTicks(laneData: Array<HistogramData>, opt: SwimlaneOptions, index: number) {
    const swimStats: SwimlaneStats = this.histogramParams.swimlaneData.stats;
    const swimRepresentation: SwimlaneRepresentation = this.histogramParams.swimlaneRepresentation;
    const swimHeight = this.histogramParams.swimlaneHeight * 0.9;
    this.context.append('g').attr('class', 'histogram__swimlane-height')
      .selectAll('path')
      .data(laneData)
      .enter().append('line')
      .attr('stroke-width', (opt && opt.level_tick && opt.level_tick.color) ? opt.level_tick.color : TICK_WIDTH)
      .attr('stroke', (opt && opt.level_tick && opt.level_tick.color) ? opt.level_tick.color : TICK_COLOR)
      .attr('opacity', (opt && opt.level_tick && opt.level_tick.opacity) ? opt.level_tick.opacity : TICK_OPACITY)
      .attr('x1', (d) => this.histogramParams.swimLaneLabelsWidth + this.swimlaneAxes.xDataDomainArray[index](d.key))
      .attr('y1', (d) => this.getLevelTickHeight(d, swimStats, swimRepresentation, SwimlaneMode.variableHeight, swimHeight, index))
      .attr('x2', (d) => this.histogramParams.swimLaneLabelsWidth + this.swimlaneAxes.xDataDomainArray[index](d.key) +
        this.swimlaneAxes.stepWidth * this.histogramParams.barWeight)
      .attr('y2', (d) => this.getLevelTickHeight(d, swimStats, swimRepresentation, SwimlaneMode.variableHeight, swimHeight, index));
  }

  private getLevelTickHeight(bucket: HistogramData, swimStats: SwimlaneStats, representation: SwimlaneRepresentation,
    swimMode: SwimlaneMode, laneHeight: number, i: number): number {
    return this.histogramParams.swimlaneHeight * (i + 1) - this.getBucketHeight(bucket, swimStats, representation, swimMode, laneHeight);
  }
}
