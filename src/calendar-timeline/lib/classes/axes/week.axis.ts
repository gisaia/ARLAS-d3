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
import { timeWeek } from 'd3-time';

export class WeekAxis extends Axis {
    private WEEK_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

    public constructor(context) {
        super(context, WeekAxis.name.toString());
        this.setTickSize(45);
    }

    public plot() {
        super.plot();
        this.element.selectAll('path').style('stroke', '#fff');
        this.element.selectAll('line').style('stroke', '#888');
        this.element.selectAll('text').attr('transform', 'translate(25, -15)');

    }



    public setBoundDates(dates: Date[]): Axis {
        super.setBoundDates(dates);
        this.setTickInterval(timeWeek);
        return this;
    }
}
