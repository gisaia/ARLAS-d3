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

import { HistogramParams } from '../../histograms/HistogramParams';
import { ChartAxes, ChartDimensions, HistogramData, HistogramSVGG } from '../utils/HistogramUtils';

export interface XBucket {
    start: number;
    end: number;
}

/**
 * A bucket that represents one data entry in the histogram.
 * This bucket is not shown graphically but will be appended to a virtual context
 * in order to listen to mouse events.
 */
export class Bucket {
    /** Inputs. */
    private data: HistogramData;
    private histogramParams: HistogramParams;
    private rootContext: HistogramSVGG;
    private dimensions: ChartDimensions;
    private axes: ChartAxes;

    /** Calculated state. */
    private hovered = false;
    private context: HistogramSVGG;
    /** This context is virtual. Buckets are not plot on the histogram. */
    private virtual = true;

    public constructor(data: HistogramData, histogramParams: HistogramParams, rootContext: HistogramSVGG,
        dimensions: ChartDimensions, axes: ChartAxes) {
        this.data = data;
        this.histogramParams = histogramParams;
        this.rootContext = rootContext;
        this.dimensions = dimensions;
        this.axes = axes;
    }

    /**
     * Transforms the x value to number and returns it.
     * @returns the bucket's x value as number
     */
    public getBucktXValue(): number {
        return +this.data.key;
    }


    /**
     * Plot the buckets on the histogram root context.
     * USE FOR DEBUG PURPOSES ONLY.
     */
    public plot() {
        this.virtual = false;
        this.context = this.rootContext.append('g').attr('class', 'interaction_bucket');
        this.context.selectAll('.bar')
            .data([this.data])
            .enter().append('rect')
            .attr('x', this.axes.xDomain(+this.data.key))
            .attr('y', 0)
            .attr('width', this.axes.stepWidth)
            .attr('height', this.dimensions.height);
    }

    /** Hovers the bucket and notifies the hoveredBucket event that the bucket has been hovered.
     * However, this notification is sent once. If the bucket remains hovered, no more notifications are sent.
    */
    public hover() {
        if (!this.hovered) {
            this.notifyHover();
        }
        this.hovered = true;
    }

    /**
     * Leaves the bucket and notifies the hoveredBucket event that the bucket has been left :'(.
     * However, this notification is sent once. If the bucket is already left, no more notifications are sent.
     */
    public leave() {
        if (this.hovered) {
            this.notifyLeave();
        }
        this.hovered = false;
    }

    /**
     * Notifies that the bucket has been hovered.
     */
    public notifyHover() {
        const xBucket: XBucket = {
            start: this.getBucktXValue(),
            end: this.getBucktXValue() + this.histogramParams.bucketRange
        };
        this.histogramParams.hoveredBucketEvent.next(xBucket);
        if (!this.virtual) {
            this.context.style('fill', 'red');
        }
    }

    /**
     * Notifies that the bucekt has been left.
     */
    public notifyLeave() {
        this.histogramParams.hoveredBucketEvent.next(undefined);
        if (!this.virtual) {
            this.context.style('fill', 'black');
        }
    }


}

/**
 * A Virtual context (in D3 jargon), where no svg elements are drawn. It is used to declare all the buckets that compose
 * the histogram.
 * The main objective of this context is to detect which bucket is hovered and notify the histogram.
 */
export class BucketsVirtualContext {
    private buckets: Bucket[] = [];
    private bucketsMap = new Map<string | number, Bucket>();

    /**
     * Add the bucket to the context.
     * @param b A bucket that represents one data entry.
     */
    public append(b: Bucket) {
        this.buckets.push(b);
        this.bucketsMap.set(b.getBucktXValue(), b);
    }

    /**
     * - Notifies the histogram when hovering a bucket that was not hovered before.
     * - Notifies the histogram when leaving a bucket that is not hovered anymore.
     * @param hoveredKey List of current hovered bucket's keys.
     */
    public interact(hoveredKey: (string | number)[]) {
        const set = new Set(hoveredKey);
        Array.from(this.bucketsMap.keys()).filter(k => !set.has(k)).forEach(k => this.bucketsMap.get(k).leave());
        Array.from(this.bucketsMap.keys()).filter(k => set.has(k)).forEach(k => this.bucketsMap.get(k).hover());
    }

    /**
     * Leaves all the given keys
     */
    public leaveAll(leftKeys: (string | number)[]) {
        const set = new Set(leftKeys);
        Array.from(this.bucketsMap.keys()).filter(k => set.has(k)).forEach(k => this.bucketsMap.get(k).leave());
    }
}
