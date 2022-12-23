import { Axis } from './axis';
import { timeDay } from 'd3-time';

export class DayAxis extends Axis {

    public constructor(context) {
        super(context, DayAxis.name.toString());
        this.setTickInterval(timeDay);
    }
}
