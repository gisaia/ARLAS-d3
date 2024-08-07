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
import { Bucket } from '../../interfaces/bucket';
import { BaseType, Selection } from 'd3-selection';
import { Subject } from 'rxjs';
import { TemporalObject } from '../temporal.object';
import { TimelineData } from '../../interfaces/timeline.data';

export class VerticalLine extends TemporalObject {

    public hoveredBucket: Subject<Bucket> = new Subject();

    private currentDate: Date;

    public constructor(context: Selection<SVGGElement, TimelineData, BaseType, TimelineData>) {
        super(context, VerticalLine.name.toString());
    }

    public plot(): void {
        super.plot();
        this.element.append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', this.dimensions.height)
            .style('stroke', this.colors.stroke)
            .style('stroke-width', 2)
            .style('fill', this.colors.fill);
        this.hide();
    }

    public show() {
        this.element.style('display', 'block');
    }

    public hide() {
        this.element.style('display', 'none');
    }

    public moveTo(p: number) {
        /** the cursor will always be displayed on the middle of the interval
                 * Positions in between are not allowed
                 */
        const date = this.round(this.axis.getDate(p));
        const position = this.axis.getPosition(date) +
            this.axis.getTickIntervalWidth() / 2;
        this.element
            .select('line')
            .attr('transform', 'translate(' + (position + 1) + ',' + 0 + ')');
        if (!this.currentDate || this.currentDate.getTime() !== date.getTime()) {
            this.hoveredBucket.next({
                date,
                position,
                show: true
            });
        }
        this.currentDate = date;
    }
}
