import { DrawableObject } from './lib/classes/drawable.object';
import { Granularity } from './lib/enumertions/granularity.enum';

export class Timeline extends DrawableObject {

    public granularity: Granularity;

    private buckets;

    public constructor(svg) {
        super(svg);
    }

    public setGranularity(granularity: Granularity): void {
        if (granularity === this.granularity) {
            // todo change axes
        }
        this.granularity = granularity;
    }

    public setBuckets(buckets) {
        // todo draw new arrived buckets on timeline
    }

}
