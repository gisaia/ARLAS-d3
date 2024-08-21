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

import { scaleLog } from 'd3-scale';
import { BaseType, Selection } from 'd3-selection';

export class Gauge {

    public gaugeRadius = 5;
    public margin = { top: 5, right: 5, bottom: 5, left: 5 };
    public cursorHeight = 10;
    public cursorRadius = 2;

    public constructor(private width: number, private height: number) {

    }

    public plot(maxValue: number, threshold: number, currentValue: number, svg: Selection<SVGElement, BaseType, SVGElement, BaseType>) {
        if (threshold === undefined || currentValue === undefined) {
            return;
        }
        // 0 does not exist on a scale log
        if (currentValue === 0) {
            currentValue = 1;
        }
        const h = this.height - this.margin.top - this.margin.bottom;
        const w = this.width - this.margin.left - this.margin.right;
        const x = scaleLog()
            .domain([maxValue, 1])
            .range([0, h]);
        svg.selectAll('g.gauge').remove();
        svg.selectAll('rect.gauge').remove();
        svg.selectAll('svg.gauge').remove();
        svg.selectAll('path.gauge').remove();
        const svgGauge = svg.attr('class', 'gauge')
            .attr('width', w + this.margin.left + this.margin.right)
            .attr('height', h + this.margin.right + this.margin.bottom)
            .append('g')
            .attr('class', 'gauge')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
        svgGauge.append('rect')
            .attr('height', d => h)
            .attr('width', d => w)
            .attr('class', 'gauge full-gauge')
            .attr('y', d => 0)
            .attr('x', d => 0)
            .attr('ry', d => this.gaugeRadius)
            .attr('rx', d => this.gaugeRadius);
        svgGauge.append('path')
            .attr('d', this.rounded_rect(0, 0, w, x(threshold), this.gaugeRadius, true, true, false, false))
            .attr('class', 'gauge part-gauge');
        svgGauge.append('rect')
            .attr('height', d => this.cursorHeight)
            .attr('width', d => w)
            .attr('class', 'gauge cursor')
            .attr('y', d => x(currentValue) - this.cursorHeight / 2)
            .attr('ry', d => this.cursorRadius)
            .attr('rx', d => this.cursorRadius);
    }

    private rounded_rect(x, y, w, h, r, tl, tr, bl, br) {
        let retval;
        retval = 'M' + (x + r) + ',' + y;
        retval += 'h' + (w - 2 * r);
        if (tr) {
            retval += 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r;
        } else {
            retval += 'h' + r; retval += 'v' + r;
        }
        retval += 'v' + (h - 2 * r);
        if (br) {
            retval += 'a' + r + ',' + r + ' 0 0 1 ' + -r + ',' + r;
        } else {
            retval += 'v' + r; retval += 'h' + -r;
        }
        retval += 'h' + (2 * r - w);
        if (bl) {
            retval += 'a' + r + ',' + r + ' 0 0 1 ' + -r + ',' + -r;
        } else {
            retval += 'h' + -r; retval += 'v' + -r;
        }
        retval += 'v' + (2 * r - h);
        if (tl) {
            retval += 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + -r;
        } else {
            retval += 'v' + -r; retval += 'h' + r;
        }
        retval += 'z';
        return retval;
    }
}
