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
import { Granularity } from '../enumerations/granularity.enum';
import { Season } from './season';
import { Axis } from './axes/axis';
import { DrawableObjectColors } from './buckets/buckets';
import { DrawableObject } from './drawable.object';

export class TemporalObject extends DrawableObject {
    protected axis: Axis;
    protected granularity: Granularity;
    protected climatological: boolean;
    protected colors: DrawableObjectColors;

    public setAxis(axis: Axis): TemporalObject {
        this.axis = axis;
        return this;
    }

    public setGranularity(granularity: Granularity): TemporalObject {
        this.granularity = granularity;
        this.setColors(granularity);
        return this;
    }

    public setClimatological(climatological: boolean): TemporalObject {
        this.climatological = climatological;
        return this;
    }

    protected setColors(granularity: Granularity): TemporalObject {
        switch (granularity) {
            case Granularity.day:
                this.colors = {
                    stroke: '#4285f4',
                    fill: '#fff'
                };
                break;
            default:
                this.colors = {
                    stroke: '#4285f4',
                    fill: '#fff'
                };
        }
        return this;
    }

    protected round(d: Date): Date {
        const roundedDate = new Date(d.getTime());
        switch (this.granularity) {
            case Granularity.day:
                roundedDate.setHours(0, 0, 0, 0);
                break;
            case Granularity.month:
                roundedDate.setDate(1);
                roundedDate.setHours(0, 0, 0, 0);
                break;
            case Granularity.season:
                return Season.getSeasonStartFromDate(d);
            case Granularity.year:
                roundedDate.setMonth(0);
                roundedDate.setDate(1);
                roundedDate.setHours(0, 0, 0, 0);
                break;
        }
        return roundedDate;
    }
}
