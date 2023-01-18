/**
 * Enum storing the first day of each season
 */
export class Season {
    private static readonly SPRING = new Season('Spring', 2, 21);
    private static readonly SUMMER = new Season('Summer', 5, 22);
    private static readonly AUTUMN = new Season('Autumn', 8, 23);
    private static readonly WINTER = new Season('Winter', 11, 21);

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
}
