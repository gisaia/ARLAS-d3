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
export class Margins {
    public top = 0;
    public bottom = 0;
    public left = 0;
    public right = 0;

    public setTop(top: number): Margins {
        this.top = top;
        return this;
    }

    public setBottom(bottom: number): Margins {
        this.bottom = bottom;
        return this;
    }

    public setLeft(left: number): Margins {
        this.left = left;
        return this;
    }

    public equals(m: Margins): boolean {
        return !!m
            && m.bottom === this.bottom
            && m.top === this.top
            && m.left === this.left
            && m.right === this.right;
    }

    public setRight(right: number): Margins {
        this.right = right;
        return this;
    }
}
