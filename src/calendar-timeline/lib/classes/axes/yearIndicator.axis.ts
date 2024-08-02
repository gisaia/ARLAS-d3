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
import { Axis } from './axis';
import { timeYear } from 'd3-time';
import { symbol } from 'd3-shape';
import { NumberValue } from 'd3-scale';
import { Dimensions } from '../dimensions/dimensions';

export class YearIndicatorAxis extends Axis {
    private YEAR_IN_MILLISECONDS = 365 * 24 * 60 * 60 * 1000;

    public constructor(context) {
        super(context, YearIndicatorAxis.name.toString());
    }

    public plot() {
        super.plot();
        const arrowSize = 12;
        const customSymbolArrow = {
            draw: (context, s) => {
                context.moveTo(0, 0);
                context.lineTo(s / 2, s);
                context.lineTo(s, 0);
                context.closePath();
            }
        };
        const customArrow = symbol().type(customSymbolArrow).size(arrowSize);

        this.element
            .append('svg:defs').append('svg:marker')
            .attr('id', (_d) => 'arrow_end')
            .attr('refX', arrowSize / 2)
            .attr('refY', arrowSize)
            .attr('markerWidth', arrowSize)
            .attr('markerHeight', arrowSize)
            .append('svg:path')
            .attr('d', customArrow)
            .style('fill', '#888');
        this.element
            .append('svg:defs').append('svg:marker')
            .attr('id', (_d) => 'arrow_start')
            .attr('refX', arrowSize / 2)
            .attr('refY', arrowSize)
            .attr('markerWidth', arrowSize)
            .attr('markerHeight', arrowSize)
            .attr('orient', 180)
            .append('svg:path')
            .attr('d', customArrow)
            .style('fill', '#888');

        this.element.selectAll('path').style('stroke', '#fff');

        this.element.selectAll('line').style('stroke', '#888')
                                      .attr('transform', 'rotate(-90)')
                                      .attr('marker-start', (_d) => 'url(#arrow_start)')
                                      .attr('marker-end', (_d) => `url(#arrow_end)`);
        const endDomain = this.domain.clamp(true)(Infinity);
        const minSpaceText = this.textFontSize * 2.5 + arrowSize;

        this.element.selectAll('text')
                    .attr('transform', (d: Date | NumberValue, i) => {
                        // If the interval does not start on screen
                        if (this.domain(d) < Math.abs(this.axisXOffset)) {
                            // Translate either between the start of the visible window and the end of the tick
                            // or between the start and end of the visible window
                            return `translate(${Math.min(this.tickSize + Math.abs(this.axisXOffset),
                                                         endDomain + Math.abs(this.axisXOffset)) / 2},` +
                                              `${-(this.tickSize + this.textFontSize * 0.75)})`;
                        }
                        return `translate(${Math.min(this.tickSize, endDomain - this.domain(d)) / 2},` +
                                          `${-(this.tickSize + this.textFontSize * 0.75)})`;
                    })
                    .style('font-size', `${this.textFontSize}px`)
                    .style('visibility', (d: Date | NumberValue, i) => {
                        // If there is not enough space for the text and the arrow
                        // or if the space available to display (between start of window and end of tick) the first tick is not enough
                        if ((endDomain - this.domain(d) < minSpaceText) ||
                                (i === 0 && this.tickSize - (this.tickSize + Math.abs(this.axisXOffset)) / 2 < minSpaceText)) {
                            return 'hidden';
                        }
                        return 'visible';
                    });

        this.element.selectAll('g')
                    .filter((d: Date | NumberValue, i) => {
                        // If there is not enough space for the text and the arrow
                        // or if the space available to display (between start of window and end of tick) the first tick is not enough
                        if ((endDomain - this.domain(d) < minSpaceText) ||
                                (i === 0 && this.tickSize - (this.tickSize + Math.abs(this.axisXOffset)) / 2 < minSpaceText)) {
                            return false;
                        }
                        return true;
                    })
                    .insert('rect', 'text')
                    .attr('width', this.textFontSize * 2.5)
                    .attr('height', this.textFontSize)
                    .attr('x', (d: Date | NumberValue, _i) => {
                        // If the interval does not start on screen
                        if (this.domain(d) < Math.abs(this.axisXOffset)) {
                            // Translate either between the start of the visible window and the end of the tick
                            // or between the start and end of the visible window
                            return (Math.min(this.tickSize + Math.abs(this.axisXOffset),
                                             endDomain + Math.abs(this.axisXOffset)) - this.textFontSize * 2.5) / 2;
                        }
                        // Else translate betwwen the start of the tick or the end of the tick or the window
                        return (Math.min(this.tickSize, endDomain - this.domain(d)) - this.textFontSize * 2.5) / 2;
                    })
                    .attr('y', - this.textFontSize / 2)
                    .attr('fill', '#fff');
    }

    public getIntervalWidth(d: Date): number {
        const nextYear = new Date(d.getFullYear() + 1, 0, 1);
        return this.domain(nextYear) - this.domain(d);
    }

    public setBoundDates(dates: Date[]): Axis {
        super.setBoundDates(dates);

        const itw = this.domain(this.YEAR_IN_MILLISECONDS) - this.domain(0);
        this.setTickSize(itw);
        this.setTickIntervalWidth(itw);
        this.setTickInterval(timeYear);

        // The goal of the following code is to make the axis believe it starts on the 1st of January of the first year
        // of its real bound dates, for it to want to display the tick that is used to represent the year.
        // Everything is then translated to account for this offset
        this.axisXOffset = this.domain(new Date(dates[0].getFullYear(), 0, 1)); // Value is negative or null

        // Putting 0 because height has no impact on the setRange method
        this.setRange(new Dimensions(this.domain.clamp(true)(Infinity) + Math.abs(this.axisXOffset), 0));
        const newDates = dates.map((d, i, _arr) => {
            if (i === 0) {
                return new Date(d.getFullYear(), 0, 1);
            }
            return d;
        });
        super.setBoundDates(newDates);
        return this;
    }
}
