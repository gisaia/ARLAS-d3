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
/**
 * Enum storing the first day of each season
 */
export class Season {
    public static readonly SPRING = new Season('Spring', 2, 21);
    public static readonly SUMMER = new Season('Summer', 5, 22);
    public static readonly AUTUMN = new Season('Autumn', 8, 23);
    public static readonly WINTER = new Season('Winter', 11, 21);

    private constructor(private readonly name: string,
        private readonly month: number,
        private readonly day: number) {
    }

    public toString() {
        return this.name;
    }

    public getDate(year: number): Date {
        return new Date(year, this.month, this.day);
    }

    public static getSeasonStartFromDate(d: Date): Date {
        const year = d.getFullYear();
        if (d < this.SPRING.getDate(year)) {
            return new Date(year - 1, this.WINTER.month, this.WINTER.day);
        }
        if ((this.SPRING.getDate(year) <= d) && (d < this.SUMMER.getDate(year))) {
            return new Date(year, this.SPRING.month, this.SPRING.day);
        }
        if ((this.SUMMER.getDate(year) <= d) && (d < this.AUTUMN.getDate(year))) {
            return new Date(year, this.SUMMER.month, this.SUMMER.day);
        }
        if ((this.AUTUMN.getDate(year) <= d) && (d < this.WINTER.getDate(year))) {
            return new Date(year, this.AUTUMN.month, this.AUTUMN.day);
        }
        return new Date(year, this.WINTER.month, this.WINTER.day);
    }

    public static getSeasonNameFromDate(d: Date): string {
        const year = d.getFullYear();
        if (d < this.SPRING.getDate(year)) {
            return this.WINTER.name;
        }
        if ((this.SPRING.getDate(year) <= d) && (d < this.SUMMER.getDate(year))) {
            return this.SPRING.name;
        }
        if ((this.SUMMER.getDate(year) <= d) && (d < this.AUTUMN.getDate(year))) {
            return this.SUMMER.name;
        }
        if ((this.AUTUMN.getDate(year) <= d) && (d < this.WINTER.getDate(year))) {
            return this.AUTUMN.name;
        }
        return this.WINTER.name;
    }

    public static getNextSeasonStartFromDate(d: Date): Date {
        const year = d.getFullYear();
        if (d < this.SPRING.getDate(year)) {
            return new Date(year, this.SPRING.month, this.SPRING.day);
        }
        if ((this.SPRING.getDate(year) <= d) && (d < this.SUMMER.getDate(year))) {
            return new Date(year, this.SUMMER.month, this.SUMMER.day);
        }
        if ((this.SUMMER.getDate(year) <= d) && (d < this.AUTUMN.getDate(year))) {
            return new Date(year, this.AUTUMN.month, this.AUTUMN.day);
        }
        if ((this.AUTUMN.getDate(year) <= d) && (d < this.WINTER.getDate(year))) {
            return new Date(year, this.WINTER.month, this.WINTER.day);
        }
        return new Date(year + 1, this.SPRING.month, this.SPRING.day);
    }

    public static getPreviousSeasonStartFromDate(d: Date): Date {
        const year = d.getFullYear();
        if (d < this.SPRING.getDate(year)) {
            return new Date(year - 1, this.AUTUMN.month, this.AUTUMN.day);
        }
        if ((this.SPRING.getDate(year) <= d) && (d < this.SUMMER.getDate(year))) {
            return new Date(year - 1, this.WINTER.month, this.WINTER.day);
        }
        if ((this.SUMMER.getDate(year) <= d) && (d < this.AUTUMN.getDate(year))) {
            return new Date(year, this.SPRING.month, this.SPRING.day);
        }
        if ((this.AUTUMN.getDate(year) <= d) && (d < this.WINTER.getDate(year))) {
            return new Date(year, this.SUMMER.month, this.SUMMER.day);
        }
        return new Date(year - 1, this.AUTUMN.month, this.AUTUMN.day);
    }


    public static getSeason(name: string): Season {
        switch (name) {
            case this.SPRING.name:
                return this.SPRING;
            case this.SUMMER.name:
                return this.SUMMER;
            case this.AUTUMN.name:
                return this.AUTUMN;
            case this.WINTER.name:
                return this.WINTER;
        }
    }
}
