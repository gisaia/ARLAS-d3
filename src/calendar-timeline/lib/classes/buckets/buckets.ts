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
import { TemporalObject } from '../temporal.object';
import { TimelineData } from '../../interfaces/timeline.data';

export interface DrawableObjectColors {
    stroke: string;
    fill: string;
}
export class Buckets extends TemporalObject {
    protected data: Array<TimelineData> = [];
    protected dates: Array<Date> = [];

    public constructor(context: Selection<SVGGElement, TimelineData, BaseType, TimelineData>) {
        super(context, Buckets.name.toString());
    }

    public setData(data: TimelineData[]): Buckets {
        this.data = data;
        const dates = data.map(d => this.round(d.date));
        this.dates = [];
        for (const d of dates) {
            let isInList = false;
            for (const date of this.dates) {
                if (d.getTime() === date.getTime()) {
                    isInList = true;
                    continue;
                }
            }
            if (!isInList) {
                this.dates.push(d);
            }
        }
        return this;
    }

    public getTimelineData(date: Date): TimelineData {
        const data = this.data.find(d => this.round(d.date).getTime() ===  this.round(date).getTime());
        return !!data ? data : {
            date: this.round(date),
            id: undefined,
            metadata: undefined
        };
    }

}
