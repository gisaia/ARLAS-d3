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
import { TimelineData } from '../interfaces/timeline.data';
import { Dimensions } from './dimensions/dimensions';

export type TimelineContext = Selection<SVGGElement, TimelineData, BaseType, TimelineData>;

export class DrawableObject {
    /** the `element` contains the drawing of this current object */
    protected element?: TimelineContext;
    /** the context is the parent element to which the current element is appended */
    protected context: TimelineContext;
    protected dimensions = new Dimensions(0, 0);

    private readonly name: string;

    public constructor(context: TimelineContext, name: string) {
        this.context = context;
        this.name = name;
    }

    public plot() {
        this.remove();
        this.element = this.context
            .append('g');
        this.element.attr('class', this.name);
    }

    public remove() {
        if (this.element) {
            this.element.remove();
            this.element = undefined;
        }
    }

    public setDimensions(dimensions: Dimensions): this {
        if (!this.dimensions || !dimensions.equals(this.dimensions)) {
            // todo : redraw
        }
        this.dimensions = dimensions;
        return this;
    }

    public onClick(e: PointerEvent): void {
    }
}
