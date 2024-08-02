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

import { select } from 'd3-selection';
import { Subject } from 'rxjs';
import { Axis } from './lib/classes/axes/axis';
import { DayAxis } from './lib/classes/axes/day.axis';
import { MonthAxis } from './lib/classes/axes/month.axis';
import { SeasonAxis } from './lib/classes/axes/season.axis';
import { WeekAxis } from './lib/classes/axes/week.axis';
import { YearAxis } from './lib/classes/axes/year.axis';
import { YearIndicatorAxis } from './lib/classes/axes/yearIndicator.axis';
import { BandBuckets } from './lib/classes/buckets/band.buckets';
import { Buckets } from './lib/classes/buckets/buckets';
import { CircleBuckets } from './lib/classes/buckets/circle.buckets';
import { Cursor } from './lib/classes/cursor/cursor';
import { VerticalLine } from './lib/classes/cursor/vertical.line';
import { Dimensions } from './lib/classes/dimensions/dimensions';
import { DrawableObject } from './lib/classes/drawable.object';
import { Season } from './lib/classes/season';
import { Granularity } from './lib/enumerations/granularity.enum';
import { Bucket } from './lib/interfaces/bucket';
import { TimelineData, TimelineTooltip } from './lib/interfaces/timeline.data';

export class Timeline extends DrawableObject {

    private granularity: Granularity;
    private climatological: boolean;
    public boundDates: Date[];
    private axis: AxesCollection;
    private buckets: BucketsCollection;
    private cursor: Cursor;
    private verticalLine: VerticalLine;
    private data: TimelineData[] = [];
    private cursorDate: Date;

    public hoveredData: Subject<TimelineTooltip> = new Subject();
    public selectedData: Subject<TimelineData> = new Subject();

    public constructor(svg) {
        super(select(svg), Timeline.name.toString());

        this.axis = new AxesCollection(this.context, this.dimensions);
        this.buckets = new BucketsCollection(this.context);
        this.cursor = new Cursor(this.context, this.granularity);
        this.verticalLine = new VerticalLine(this.context);

        this.context.on('click', (e) => this.onClick(e));
        this.context.on('mouseenter', (e) => this.onMouseenter(e));
        this.context.on('mouseleave', (e) => this.onMouseleave(e));
        this.context.on('mousemove', (e) => this.onMousemove(e));

        this.cursor.hoveredBucket.subscribe({
            next: (b: Bucket) => {
                this.hoveredData.next({
                    data: this.buckets.get().getTimelineData(b.date),
                    stringDate: Timeline.dateToString(b.date, this.granularity, this.climatological),
                    position: b.position,
                    shown: b.show,
                    width: this.dimensions.width
                });
            }
        });

        this.cursor.selectedDate.subscribe({
            next: (d: Date) => {
                this.selectedData.next(this.buckets.get().getTimelineData(d));
            }
        });
        this.verticalLine.hoveredBucket.subscribe({
            next: (b: Bucket) => {
                this.hoveredData.next({
                    data: this.buckets.get().getTimelineData(b.date),
                    stringDate: Timeline.dateToString(b.date, this.granularity, this.climatological),
                    position: b.position,
                    shown: b.show,
                    width: this.dimensions.width
                });
            }
        });

    }

    public setGranularity(granularity: Granularity): Timeline {
        this.granularity = granularity;
        this.cursor.setCursorOffset(granularity);
        return this;
    }

    public setBoundDates(dates: Date[]): Timeline {
        this.boundDates = dates;
        return this;
    }

    public setClimatological(climatological: boolean): Timeline {
        this.climatological = climatological;
        return this;
    }

    public setData(data): Timeline {
        this.data = data;
        return this;
    }

    public moveCursor(d: Date): void {
        this.cursorDate = d;
        this.cursor.moveToDate(d);
    }

    public plot(emitSelectedData = false): void {
        this.axis
            .setDimensions(this.dimensions)
            .update(this.granularity, this.boundDates, this.climatological);
        this.verticalLine
            .setAxis(this.axis.get())
            .setGranularity(this.granularity)
            .setDimensions(this.dimensions)
            .plot();
        this.buckets
            .update(this.granularity, this.climatological)
            .setData(this.data)
            .setAxis(this.axis.get())
            .plot();
        this.cursor
            .setVerticalLine(this.verticalLine)
            .setAxis(this.axis.get())
            .setGranularity(this.granularity)
            .plot();
        if (this.cursorDate) {
            this.moveCursor(this.cursorDate);
            if (emitSelectedData) {
                this.selectedData.next(this.buckets.get().getTimelineData(this.cursorDate));
            }
        }
    }

    public onClick(e: PointerEvent): void {
        super.onClick(e);
        this.cursor.moveTo(e.offsetX);
        const date = this.axis.get().getDate(e.offsetX);
        this.selectedData.next(this.buckets.get().getTimelineData(date));
    }

    public onMouseenter(e: PointerEvent): void {
        this.verticalLine.show();
    }
    public onMouseleave(e: PointerEvent): void {
        this.verticalLine.hide();
        this.hoveredData.next({
            data: null,
            stringDate: '',
            position: 0,
            shown: false,
            width: this.dimensions.width
        });
    }

    public onMousemove(e: PointerEvent): void {
        this.verticalLine.moveTo(e.offsetX);
    }

    public static dateToString(d: Date, granularity: Granularity, climatological?: boolean): string {
        const year = d.getFullYear();
        switch (granularity) {
            case Granularity.day:
                const day = d.getDate();
                const ordinal = (day === 1) ? 'st' : ((day === 2) ? 'nd' : (day === 3) ? 'rd' : 'th');
                return `${d.toLocaleString('en', { month: 'short' })}, ${day}${ordinal} ${year}`;
            case Granularity.month:
                if (climatological) {
                    return `${d.toLocaleString('en', { month: 'long' })}`;
                } else {
                    return `${d.toLocaleString('en', { month: 'short' })} ${year}`;
                }
            case Granularity.season:
                if (climatological) {
                    return Season.getSeasonNameFromDate(d);
                } else {
                    const season = Season.getSeasonNameFromDate(d);
                    const yearComplement = season === Season.WINTER.toString() ? `/${year + 1}` : '';
                    return `${Season.getSeasonNameFromDate(d)} ${year}${yearComplement}`;
                }
            case Granularity.year:
                return `${year}`;
        }
    }
}

export class AxesCollection {
    private axis: Axis;
    private annexedAxes: Axis[] = [];
    private context;
    private dimensions: Dimensions;

    public constructor(context, dimensions: Dimensions) {
        this.context = context;
        this.dimensions = dimensions;
    }

    public setDimensions(dimensions: Dimensions): AxesCollection {
        this.dimensions = dimensions;
        return this;
    }

    public update(granularity: Granularity, boundsDate: Date[], climatological: boolean): Axis {
        if (this.axis) {
            this.axis.remove();
            this.axis = null;
        }
        if (!!this.annexedAxes) {
            this.annexedAxes.forEach(a => {
                a.remove();
                a = null;
            });
            this.annexedAxes = [];
        }
        const yearIndicatorAxis = new YearIndicatorAxis(this.context);
        if (boundsDate && boundsDate.length === 2) {
            switch (granularity) {
                case Granularity.day:
                    boundsDate = boundsDate.map((date, idx, arr) => {
                        const newDate = new Date(date.getTime());
                        if (idx === 0) {
                            newDate.setHours(0, 0, 0, 0);
                        } else if (idx === arr.length - 1) {
                            if (newDate.getTime() !==
                                (new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 0, 0, 0, 0)).getTime()) {
                                newDate.setDate(newDate.getDate() + 1);
                                newDate.setHours(0, 0, 0, 0);
                            }
                        }
                        return newDate;
                    });
                    this.axis = new DayAxis(this.context);
                    this.axis.setRange(this.dimensions)
                        .setBoundDates(boundsDate)
                        .plot();
                    const weekAxis = new WeekAxis(this.context);
                    weekAxis
                        .setRange(this.dimensions)
                        .setBoundDates(boundsDate)
                        .plot();
                    this.annexedAxes.push(weekAxis);
                    if (!climatological) {
                        yearIndicatorAxis.setRange(this.dimensions)
                            .setBoundDates(boundsDate)
                            .setAxisYOffset(80)
                            .plot();
                        this.annexedAxes.push(yearIndicatorAxis);
                    }
                    break;
                case Granularity.month:
                    boundsDate = boundsDate.map((date, idx, arr) => {
                        const newDate = new Date(date.getTime());
                        if (idx === 0) {
                            newDate.setDate(1);
                            newDate.setHours(0, 0, 0, 0);
                        } else if (idx === arr.length - 1) {
                            if (newDate.getTime() !== (new Date(newDate.getFullYear(), newDate.getMonth(), 1, 0, 0, 0, 0)).getTime()) {
                                newDate.setMonth(newDate.getMonth() + 1);
                                newDate.setDate(1);
                                newDate.setHours(0, 0, 0, 0);
                            }
                        }
                        return newDate;
                    });
                    this.axis = new MonthAxis(this.context);
                    this.axis.setRange(this.dimensions)
                        .setBoundDates(boundsDate)
                        .plot();
                    if (!climatological) {
                        yearIndicatorAxis.setRange(this.dimensions)
                            .setBoundDates(boundsDate)
                            .setAxisYOffset(80)
                            .plot();
                        this.annexedAxes.push(yearIndicatorAxis);
                    }
                    break;
                case Granularity.season:
                    boundsDate = boundsDate.map((date, idx, arr) => {
                        if (idx === 0) {
                            return Season.getSeasonStartFromDate(date);
                        } else if (idx === arr.length - 1) {
                            return Season.getNextSeasonStartFromDate(date);
                        }
                        return new Date(date.getTime());
                    });

                    this.axis = new SeasonAxis(this.context);
                    this.axis.setRange(this.dimensions)
                        .setBoundDates(boundsDate)
                        .plot();
                    if (!climatological) {
                        yearIndicatorAxis.setRange(this.dimensions)
                            .setBoundDates(boundsDate)
                            .setAxisYOffset(80)
                            .plot();
                        this.annexedAxes.push(yearIndicatorAxis);
                    }
                    break;
                case Granularity.year:
                    boundsDate = boundsDate.map((date, idx, arr) => {
                        const newDate = new Date(date.getTime());
                        if (idx === 0) {
                            newDate.setMonth(0);
                            newDate.setDate(1);
                            newDate.setHours(0, 0, 0, 0);
                        } else if (idx === arr.length - 1) {
                            newDate.setFullYear(newDate.getFullYear() + 1, 0, 1);
                            newDate.setHours(0, 0, 0, 0);
                        }
                        return newDate;
                    });

                    this.axis = new YearAxis(this.context);
                    this.axis.setRange(this.dimensions)
                        .setBoundDates(boundsDate)
                        .plot();
                    yearIndicatorAxis.remove();
                    break;
            }
        }
        return this.get();

    }

    public get(): Axis {
        return this.axis;
    }
}

export class BucketsCollection {
    private buckets: Buckets;
    private context;

    public constructor(context) {
        this.context = context;
    }

    public update(granularity: Granularity, climatological: boolean): Buckets {
        if (this.buckets) {
            this.buckets.remove();
            this.buckets = null;
        }
        switch (granularity) {
            case Granularity.day:
                this.buckets = new CircleBuckets(this.context);
                break;
            case Granularity.month:
                this.buckets = new BandBuckets(this.context);
                break;
            case Granularity.season:
                this.buckets = new BandBuckets(this.context);
                break;
            case Granularity.year:
                this.buckets = new BandBuckets(this.context);
                break;
        }
        return this.get().setClimatological(climatological).setGranularity(granularity) as Buckets;

    }

    public get(): Buckets {
        return this.buckets;
    }

}
