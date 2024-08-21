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
import { Margins } from './margins';

export class Dimensions {
    public width: number;
    public height: number;

    public margins: Margins;

    public constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.margins = new Margins();
    }

    public setWidth(width: number): Dimensions {
        this.width = width;
        return this;
    }

    public setHeight(height: number): Dimensions {
        this.height = height;
        return this;
    }

    public setMargins(margins: Margins): Dimensions {
        this.margins = margins;
        return this;
    }

    public equals(d: Dimensions): boolean {
        return !!d
            && d.width === this.width
            && d.height === this.height
            && d.margins.equals(this.margins);
    }
}
