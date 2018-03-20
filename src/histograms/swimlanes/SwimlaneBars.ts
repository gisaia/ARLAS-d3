import { AbstractSwimlane } from './AbstractSwimlane';
import { HistogramData, HistogramUtils, SwimlaneMode } from '../utils/HistogramUtils';

export class SwimlaneBars extends AbstractSwimlane {

  protected plotOneLane(data: Array<HistogramData>, indexOfLane): void {
    this.plotBars(data, this.swimlaneAxes, this.swimlaneAxes.xDataDomainArray[indexOfLane]);
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
      .attr('y1', (d) => this.histogramParams.swimlaneHeight * (index + 1)
        - (+d.value) * (this.histogramParams.swimlaneHeight - 5) / (+this.swimlaneMaxValue))
      .attr('x2', (d) => this.histogramParams.swimLaneLabelsWidth + this.swimlaneAxes.xDataDomainArray[index](d.key) +
        this.swimlaneAxes.stepWidth * this.histogramParams.barWeight)
      .attr('y2', (d) => this.histogramParams.swimlaneHeight * (index + 1)
        - (+d.value) * (this.histogramParams.swimlaneHeight - 5) / (+this.swimlaneMaxValue));
  }
}
