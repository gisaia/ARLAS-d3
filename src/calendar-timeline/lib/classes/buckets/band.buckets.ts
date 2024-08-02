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
import { BaseType, Selection } from 'd3-selection';
import { Buckets } from './buckets';
import { TimelineData } from '../../interfaces/timeline.data';

export class BandBuckets extends Buckets {

    public constructor(context: Selection<SVGGElement, TimelineData, BaseType, TimelineData>) {
        super(context);
    }

    public plot() {
        super.plot();
        const fillColor = this.climatological ? this.colors.stroke : this.colors.fill;
        this.element
            .attr('transform', 'translate(1, 3)')
            .selectAll('dot')
            .data(this.dates)
            .enter()
            .append('rect')
            .attr('width', d => this.axis.getIntervalWidth(d) * 0.7)
            .attr('x', d => this.axis.getPosition(d) + this.axis.getIntervalWidth(d) * 0.15)
            .attr('height', 8)
            .attr('rx', 4)
            .attr('stroke-width', d => this.dynamicStrokeWidth(d))
            .style('stroke', this.colors.stroke)
            .style('fill', fillColor);
    }

    public dynamicStrokeWidth(d: Date): number {
        if (this.axis.getIntervalWidth(d) < 10) {
            return 1;
        }
        return Math.round(Math.log10(this.axis.getIntervalWidth(d)));
    }
}
