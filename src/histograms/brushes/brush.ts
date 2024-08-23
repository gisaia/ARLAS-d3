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

import { BrushBehavior, BrushSelection, D3BrushEvent } from 'd3-brush';
import { ChartAxes, ChartDimensions, HistogramData, HistogramSVGG } from '../utils/HistogramUtils';

export abstract class Brush {
    public brushContext: HistogramSVGG;
    public extent: BrushBehavior<HistogramData>;
    public isBrushed = false;
    public isBrushing = false;

    protected context: HistogramSVGG;
    protected dimensions: ChartDimensions;
    protected axes: ChartAxes;
    protected handles;

    public constructor(context: HistogramSVGG, dimensions: ChartDimensions, axes: ChartAxes) {
        this.context = context;
        this.dimensions = dimensions;
        this.axes = axes;
    }

    public size() {
        return 0;
    }

    public abstract getExtent(): BrushBehavior<HistogramData>;


    public plot(): Brush {
        this.brushContext = this.context.append('g')
            .attr('class', this.getCssName())
            .style('pointer-events', 'visible')
            .call(this.getExtent());
        this.brushContext.selectAll('.selection')
            .attr('fill-opacity', this.getFillOpacity());
        this.drawHandles();
        this.callBrushStart();
        return this;
    }

    public move([start, end]: number[]): Brush {
        if (this.checkSelectionNotNaN([start, end])) {
            this.brushContext.call(this.extent.move, [start, end]);
        }
        return this;
    }

    public abstract onBrushEnd(): void;

    public abstract onBrushStart(): void;

    public abstract onBrushing(): void;

    public abstract translateBrushHandles(selection: BrushSelection): void;

    public abstract getCssName(): string;

    public abstract getFillOpacity(): number;

    protected callBrushStart() {
        this.extent.on('start', (event: D3BrushEvent<HistogramData>) => {
            this.onBrushStart();
            const selection = event.selection;
            this.isBrushed = false;
            this.translateBrushHandles(selection);
        });
    }

    protected abstract drawHandles(): void;

    protected checkSelectionNotNaN(selection: BrushSelection): boolean {
        return !this.checkIfNaN(selection[0]) && !this.checkIfNaN(selection[1]);
    }

    private checkIfNaN(v: number | [number, number]): boolean {
        if (typeof v === 'number') {
            return isNaN(v);
        } else {
            return isNaN(v[0]) || isNaN(v[1]);
        }
    }
}
