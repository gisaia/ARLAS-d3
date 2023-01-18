import { Granularity } from '../enumerations/granularity.enum';
import { Season } from './season';
import { Axis } from './axes/axis';
import { DrawableObjectColors } from './buckets/buckets';
import { DrawableObject } from './drawable.object';

export class TemporalObject extends DrawableObject {
    protected axis: Axis;
    protected granularity: Granularity;
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
