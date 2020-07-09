import { Model } from '../model';
import { StdDevResult } from './stddev_model_result';
import { HistogramData } from 'histograms/utils/HistogramUtils';

export class StdDevModel extends Model {

    public apply(): StdDevResult {
        if (this.data && this.data.length > 0) {
            const mean = this.data.map((d: HistogramData) => d.value).reduce((a, b) => a + b) / this.data.length;
            const variance = this.data.map((d: HistogramData) => Math.pow(d.value - mean, 2)).reduce((a, b) => a + b) / this.data.length;
            const stddev = Math.sqrt(variance);
            const stddevResult: StdDevResult = {
                result: stddev
            };
            return stddevResult;
        }
        return null;
    }

    public store(stddevResult: StdDevResult): void {

    }
}
