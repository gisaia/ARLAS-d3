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
import { Selection, BaseType } from 'd3-selection';
import { Dimensions } from './dimensions/dimensions';
import { TimelineData } from '../interfaces/timeline.data';

export class DrawableObject {
    /** the `element` contains the drawing of this current object */
    protected element: Selection<SVGGElement, TimelineData, BaseType, TimelineData>;
    /** the context is the parent element to which the current element is appended */
    protected context: Selection<SVGGElement, TimelineData, BaseType, TimelineData>;
    protected dimensions: Dimensions;

    private name: string;

    public constructor(context: Selection<SVGGElement, TimelineData, BaseType, TimelineData>, name: string) {
        this.context = context;
        this.name = name;
        /** Listen to events */
    }

    public plot() {
        this.remove();
        this.element = this.context
            .append('g');
        this.element.attr('class', this.name);
    }

    public remove() {
        if (!!this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    public setDimensions(dimensions: Dimensions): DrawableObject {
        if (!dimensions.equals(this.dimensions)) {
            // todo : redraw
        }
        this.dimensions = dimensions;
        return this;
    }

    public onClick(e): void {
    }


}
