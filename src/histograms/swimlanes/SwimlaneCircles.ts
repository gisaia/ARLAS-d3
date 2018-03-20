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
